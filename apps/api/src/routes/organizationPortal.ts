import { FastifyInstance } from 'fastify';
import { db, organizations, memberships, users, customers, repositories, usageRecords } from '@codeguard/database';
import { eq, and, desc, sql } from 'drizzle-orm';
import { verifyJwt, hasMinimumRole } from '@codeguard/auth';
import { entitlementEngine } from '@codeguard/policy-engine';

export async function organizationPortalRoutes(app: FastifyInstance): Promise<void> {
  // Helper to extract authenticated user and org
  async function resolveOrgAuth(req: any, reply: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({ error: 'Authentication required' });
      return null;
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const payload = await verifyJwt(token);
    if (!payload) {
      reply.status(401).send({ error: 'Invalid or expired token' });
      return null;
    }

    let customer = null;
    if (payload.customerId) {
      [customer] = await db.select().from(customers).where(eq(customers.id, payload.customerId)).limit(1);
    } else {
      [customer] = await db.select().from(customers).where(eq(customers.primaryUserId, payload.sub)).limit(1);
    }

    if (!customer || !customer.organizationId) {
      reply.status(403).send({ error: 'Current account does not belong to an organization' });
      return null;
    }

    const [org] = await db.select().from(organizations).where(eq(organizations.id, customer.organizationId)).limit(1);
    if (!org) {
      reply.status(404).send({ error: 'Organization not found' });
      return null;
    }

    return { user: payload, customer, org };
  }

  // 1. Organization Overview & Seats
  app.get('/org/overview', async (req, reply) => {
    const auth = await resolveOrgAuth(req, reply);
    if (!auth) return;

    try {
      const members = await db
        .select({
          membershipId: memberships.id,
          role: memberships.role,
          joinedAt: memberships.createdAt,
          user: users
        })
        .from(memberships)
        .innerJoin(users, eq(memberships.userId, users.id))
        .where(eq(memberships.organizationId, auth.org.id));

      const repos = await db
        .select()
        .from(repositories)
        .where(eq(repositories.organizationId, auth.org.id));

      const entitlements = await entitlementEngine.getCustomerEntitlements(auth.customer.id);
      const seatLimit = (await entitlementEngine.getLimit(auth.customer.id, 'USER_SEATS')) || 50;
      const repoLimit = (await entitlementEngine.getLimit(auth.customer.id, 'REPO_LIMIT')) || 50;

      const seatsUsed = members.length;
      const reposUsed = repos.length;

      return reply.send({
        organization: auth.org,
        customer: auth.customer,
        seats: {
          used: seatsUsed,
          limit: seatLimit,
          available: Math.max(0, seatLimit - seatsUsed),
          percentage: Math.min(100, Math.round((seatsUsed / seatLimit) * 100)),
          isLimitReached: seatsUsed >= seatLimit
        },
        repos: {
          used: reposUsed,
          limit: repoLimit,
          available: Math.max(0, repoLimit - reposUsed)
        },
        members,
        repositories: repos,
        entitlements
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 2. Members list
  app.get('/org/members', async (req, reply) => {
    const auth = await resolveOrgAuth(req, reply);
    if (!auth) return;

    try {
      const rawMembers = await db
        .select({
          id: memberships.id,
          role: memberships.role,
          createdAt: memberships.createdAt,
          user: users
        })
        .from(memberships)
        .innerJoin(users, eq(memberships.userId, users.id))
        .where(eq(memberships.organizationId, auth.org.id));

      // Flatten so the frontend can access name/email directly
      const members = rawMembers.map((m) => ({
        id: m.id,
        name: m.user.name ?? m.user.email?.split('@')[0] ?? 'Unknown',
        email: m.user.email ?? '—',
        role: m.role,
        joinedAt: m.createdAt,
        avatarUrl: m.user.avatarUrl ?? null,
      }));

      const seatLimit = (await entitlementEngine.getLimit(auth.customer.id, 'USER_SEATS')) || 50;

      return reply.send({ members, seatLimit });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 3. Invite Member (Enforces Seat Limit)
  app.post('/org/members/invite', async (req, reply) => {
    const auth = await resolveOrgAuth(req, reply);
    if (!auth) return;

    const body = req.body as { email: string; name?: string; role?: string };
    if (!body.email) return reply.status(400).send({ error: 'email is required' });

    try {
      // 1. Check seat limit
      const existingMembers = await db
        .select()
        .from(memberships)
        .where(eq(memberships.organizationId, auth.org.id));

      const seatLimit = (await entitlementEngine.getLimit(auth.customer.id, 'USER_SEATS')) || 1;

      if (existingMembers.length >= seatLimit) {
        return reply.status(403).send({
          error: 'SEAT_LIMIT_REACHED',
          message: `Your organization has reached its seat limit (${seatLimit} users). Upgrade to Enterprise to add more members.`,
          current: existingMembers.length,
          limit: seatLimit
        });
      }

      // 2. Find or create user
      let [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
      if (!user) {
        [user] = await db
          .insert(users)
          .values({
            email: body.email,
            name: body.name || body.email.split('@')[0]
          })
          .returning();
      }

      // 3. Add membership
      const [newMembership] = await db
        .insert(memberships)
        .values({
          organizationId: auth.org.id,
          userId: user.id,
          role: (body.role as any) || 'MEMBER'
        })
        .onConflictDoNothing()
        .returning();

      // Record seat usage
      await entitlementEngine.recordUsage(auth.customer.id, 'USER_SEATS', 1);

      return reply.status(201).send({
        membership: newMembership,
        user,
        message: `Member ${body.email} invited and joined successfully.`
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 4. Remove Member
  app.delete('/org/members/:id', async (req, reply) => {
    const auth = await resolveOrgAuth(req, reply);
    if (!auth) return;

    const { id } = req.params as { id: string };

    try {
      await db
        .delete(memberships)
        .where(and(eq(memberships.id, id), eq(memberships.organizationId, auth.org.id)));

      return reply.send({ success: true, message: 'Member removed from organization' });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 5. Update Member Role
  app.patch('/org/members/:id/role', async (req, reply) => {
    const auth = await resolveOrgAuth(req, reply);
    if (!auth) return;

    const { id } = req.params as { id: string };
    const { role } = req.body as { role: string };

    if (!role) return reply.status(400).send({ error: 'Role is required' });

    try {
      const [updated] = await db
        .update(memberships)
        .set({ role: role as any, updatedAt: new Date() })
        .where(and(eq(memberships.id, id), eq(memberships.organizationId, auth.org.id)))
        .returning();

      return reply.send({ membership: updated });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}
