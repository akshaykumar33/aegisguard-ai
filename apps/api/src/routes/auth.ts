import { FastifyInstance } from 'fastify';
import { db, users, customers, subscriptions, plans, organizations, memberships, sessions, auditLogs } from '@codeguard/database';
import { eq, desc } from 'drizzle-orm';
import { signJwt, verifyJwt, hashPassword, verifyPassword } from '@codeguard/auth';
import { subscriptionService, entitlementEngine } from '@codeguard/policy-engine';
import { config } from '@codeguard/config';

type UserRow = typeof users.$inferSelect;

/** Strip the credential hash before a user row crosses the API boundary. */
function toPublicUser(user: UserRow) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // 1. Register
  app.post('/auth/register', async (req, reply) => {
    const body = req.body as {
      email: string;
      password?: string;
      name: string;
      customerType?: 'INDIVIDUAL' | 'PROFESSIONAL' | 'ORGANIZATION';
      profession?: string;
      planSlug?: string;
    };

    if (!body.email || !body.name) {
      return reply.status(400).send({ error: 'Email and name are required' });
    }

    if (!body.password || body.password.length < 8) {
      return reply.status(400).send({ error: 'Password is required and must be at least 8 characters' });
    }

    try {
      // Check existing user
      const [existing] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
      if (existing) {
        return reply.status(409).send({ error: 'User with this email already exists' });
      }

      // Create user. isPlatformAdmin is never settable through self-registration.
      const [user] = await db
        .insert(users)
        .values({
          email: body.email,
          name: body.name,
          passwordHash: await hashPassword(body.password)
        })
        .returning();

      // Create organization if customerType is ORGANIZATION
      let orgId: string | undefined = undefined;
      const custType = body.customerType || 'INDIVIDUAL';

      if (custType === 'ORGANIZATION') {
        const slug = body.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + `-${Math.floor(Math.random() * 1000)}`;
        const [org] = await db
          .insert(organizations)
          .values({
            name: body.name,
            slug
          })
          .returning();

        orgId = org.id;

        await db.insert(memberships).values({
          organizationId: org.id,
          userId: user.id,
          role: 'OWNER'
        });
      }

      // Create Customer
      const [customer] = await db
        .insert(customers)
        .values({
          type: custType,
          name: body.name,
          email: body.email,
          profession: body.profession || (custType === 'ORGANIZATION' ? 'Enterprise' : 'Developer'),
          organizationId: orgId,
          primaryUserId: user.id,
          status: 'ACTIVE'
        })
        .returning();

      // Assign selected plan or default basic
      const targetSlug = body.planSlug || (custType === 'ORGANIZATION' ? 'enterprise' : (custType === 'PROFESSIONAL' ? 'pro' : 'basic-student'));
      const [targetPlan] = await db.select().from(plans).where(eq(plans.slug, targetSlug)).limit(1);

      if (targetPlan) {
        await subscriptionService.subscribe(customer.id, targetPlan.id, 'MONTHLY', user.id);
      }

      // Sign JWT
      const token = await signJwt({
        sub: user.id,
        email: user.email,
        orgId,
        customerId: customer.id,
        role: custType === 'ORGANIZATION' ? 'OWNER' : 'MEMBER'
      });

      return reply.status(201).send({
        token,
        user: toPublicUser(user),
        customer,
        plan: targetPlan
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 2. Login
  app.post('/auth/login', async (req, reply) => {
    const { email, password } = req.body as { email: string; password?: string };

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password are required' });
    }

    try {
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

      // Same response whether the user is absent, has no password set (SSO-only),
      // or supplied the wrong one — so this endpoint cannot enumerate accounts.
      if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const [customer] = await db.select().from(customers).where(eq(customers.primaryUserId, user.id)).limit(1);
      // Platform staff are marked by a column an administrator must set. This was
      // previously derived from the email string, so registering an address
      // containing "superadmin" was enough to become one.
      const isSuperAdmin = user.isPlatformAdmin;

      const token = await signJwt({
        sub: user.id,
        email: user.email,
        orgId: customer?.organizationId ?? undefined,
        customerId: customer?.id ?? undefined,
        role: isSuperAdmin ? 'ADMIN' : 'MEMBER',
        isPlatformAdmin: isSuperAdmin
      });

      return reply.send({
        token,
        user: toPublicUser(user),
        customer,
        isPlatformAdmin: isSuperAdmin
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 3. Demo Quick-Login Switcher
  app.post('/auth/demo-login', async (req, reply) => {
    // Mints a session for a fixed email with no credential, and previously granted
    // platform-admin simply for asking with role='admin'. Never expose in production.
    if (config.NODE_ENV === 'production') {
      return reply.status(404).send({ error: 'Not found' });
    }

    const { role } = req.body as { role: 'student' | 'pro' | 'org' | 'admin' };

    const emailMap: Record<string, string> = {
      student: 'student@codeguard.dev',
      pro: 'pro@codeguard.dev',
      org: 'admin@acmepayments.com',
      admin: 'superadmin@codeguard.dev'
    };

    const targetEmail = emailMap[role] || 'pro@codeguard.dev';

    try {
      const [user] = await db.select().from(users).where(eq(users.email, targetEmail)).limit(1);
      if (!user) {
        return reply.status(404).send({ error: `Demo user for ${role} not found. Please run seed script.` });
      }

      const [customer] = await db.select().from(customers).where(eq(customers.primaryUserId, user.id)).limit(1);
      // Read the flag off the seeded user rather than trusting the requested role.
      const isPlatformAdmin = user.isPlatformAdmin;

      let orgId = customer?.organizationId ?? undefined;
      if (!orgId) {
        const [mem] = await db.select().from(memberships).where(eq(memberships.userId, user.id)).limit(1);
        if (mem) orgId = mem.organizationId;
      }

      const token = await signJwt({
        sub: user.id,
        email: user.email,
        orgId,
        customerId: customer?.id ?? undefined,
        role: isPlatformAdmin ? 'ADMIN' : (role === 'org' ? 'OWNER' : 'MEMBER'),
        isPlatformAdmin
      });

      return reply.send({
        token,
        user: toPublicUser(user),
        customer,
        role,
        isPlatformAdmin
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 4. Me / Current Session Context
  app.get('/auth/me', async (req, reply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const payload = await verifyJwt(token);
    if (!payload) {
      return reply.status(401).send({ error: 'Invalid or expired session token' });
    }

    try {
      const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
      let customer = null;
      let entitlements = null;

      if (payload.customerId) {
        [customer] = await db.select().from(customers).where(eq(customers.id, payload.customerId)).limit(1);
      } else {
        [customer] = await db.select().from(customers).where(eq(customers.primaryUserId, payload.sub)).limit(1);
      }

      if (customer) {
        entitlements = await entitlementEngine.getCustomerEntitlements(customer.id);
      }

      return reply.send({
        user: toPublicUser(user),
        customer,
        entitlements,
        isPlatformAdmin: payload.isPlatformAdmin || false,
        isImpersonated: payload.isImpersonated || false,
        impersonatedBy: payload.impersonatedBy
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}
