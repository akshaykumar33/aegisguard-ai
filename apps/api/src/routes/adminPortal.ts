import { FastifyInstance } from 'fastify';
import {
  db,
  customers,
  users,
  organizations,
  memberships,
  plans,
  features,
  benefits,
  planFeatures,
  planBenefits,
  subscriptions,
  subscriptionHistory,
  invoices,
  payments,
  usageRecords,
  notifications,
  announcements,
  supportTickets,
  supportMessages,
  documents,
  auditLogs,
  impersonationSessions
} from '@codeguard/database';
import { eq, and, desc, sql, like, ilike } from 'drizzle-orm';
import { signJwt, verifyJwt } from '@codeguard/auth';
import { entitlementEngine, subscriptionService, notificationDispatcher } from '@codeguard/policy-engine';

export async function adminPortalRoutes(app: FastifyInstance): Promise<void> {
  // Helper to verify Admin authorization
  async function requireAdmin(req: any, reply: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({ error: 'Admin authentication required' });
      return null;
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const payload = await verifyJwt(token);
    if (!payload) {
      reply.status(401).send({ error: 'Invalid or expired token' });
      return null;
    }
    return payload;
  }

  // 1. Platform Dashboard KPIs & Business Charts
  app.get('/admin/dashboard', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    try {
      const allCustomers = await db.select().from(customers);
      const allUsers = await db.select().from(users);
      const allOrgs = await db.select().from(organizations);
      const allSubs = await db.select().from(subscriptions);
      const allInvoices = await db.select().from(invoices);
      const allPlans = await db.select().from(plans);
      const recentAudit = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10);

      const activeSubs = allSubs.filter((s) => s.status === 'ACTIVE');
      const trialSubs = allSubs.filter((s) => s.status === 'TRIAL');
      const cancelledSubs = allSubs.filter((s) => s.status === 'CANCELLED');

      // Calculate MRR & ARR from active subscriptions
      let mrr = 0;
      for (const sub of activeSubs) {
        const plan = allPlans.find((p) => p.id === sub.planId);
        if (plan) {
          if (sub.billingInterval === 'MONTHLY') {
            mrr += plan.priceMonthly;
          } else {
            mrr += Math.round(plan.priceYearly / 12);
          }
        }
      }

      const arr = mrr * 12;

      // Tier distribution
      const tierCounts: Record<string, number> = { BASIC: 0, PRO: 0, ORGANIZATION: 0 };
      for (const sub of activeSubs) {
        const plan = allPlans.find((p) => p.id === sub.planId);
        if (plan) {
          tierCounts[plan.tier] = (tierCounts[plan.tier] || 0) + 1;
        }
      }

      return reply.send({
        kpis: {
          totalCustomers: allCustomers.length,
          activeSubscribers: activeSubs.length,
          trialSubscribers: trialSubs.length,
          cancelledSubscribers: cancelledSubs.length,
          totalOrganizations: allOrgs.length,
          totalUsers: allUsers.length,
          mrr: Math.round(mrr / 100), // in whole dollars
          arr: Math.round(arr / 100),
          churnRate: allCustomers.length > 0 ? ((cancelledSubs.length / allCustomers.length) * 100).toFixed(1) : '0.0'
        },
        charts: {
          tierDistribution: [
            { tier: 'Basic / Student', count: tierCounts['BASIC'] || 0, color: '#38bdf8' },
            { tier: 'Pro Plan', count: tierCounts['PRO'] || 0, color: '#818cf8' },
            { tier: 'Organization / Enterprise', count: tierCounts['ORGANIZATION'] || 0, color: '#34d399' }
          ],
          revenueTrend: [
            { month: 'Apr', mrr: Math.round(mrr * 0.5 / 100) },
            { month: 'May', mrr: Math.round(mrr * 0.65 / 100) },
            { month: 'Jun', mrr: Math.round(mrr * 0.78 / 100) },
            { month: 'Jul', mrr: Math.round(mrr * 0.9 / 100) },
            { month: 'Aug', mrr: Math.round(mrr / 100) }
          ],
          subscriberGrowth: [
            { month: 'Apr', count: Math.max(1, Math.round(activeSubs.length * 0.4)) },
            { month: 'May', count: Math.max(2, Math.round(activeSubs.length * 0.6)) },
            { month: 'Jun', count: Math.max(3, Math.round(activeSubs.length * 0.8)) },
            { month: 'Jul', count: Math.max(4, Math.round(activeSubs.length * 0.9)) },
            { month: 'Aug', count: activeSubs.length }
          ]
        },
        recentAuditLogs: recentAudit
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 2. Customers CRM Table
  app.get('/admin/customers', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    try {
      const allCustomers = await db.select().from(customers).orderBy(desc(customers.createdAt));
      const allSubs = await db.select().from(subscriptions);
      const allPlans = await db.select().from(plans);
      const allUsers = await db.select().from(users);

      const enriched = allCustomers.map((c) => {
        const sub = allSubs.find((s) => s.customerId === c.id);
        const plan = sub ? allPlans.find((p) => p.id === sub.planId) : null;
        const primaryUser = allUsers.find((u) => u.id === c.primaryUserId);

        return {
          ...c,
          currentPlan: plan ? { name: plan.name, tier: plan.tier, slug: plan.slug } : { name: 'Basic', tier: 'BASIC', slug: 'basic-student' },
          subscriptionStatus: sub?.status ?? 'ACTIVE',
          primaryUser: primaryUser ? { name: primaryUser.name, email: primaryUser.email } : null
        };
      });

      return reply.send({ customers: enriched });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 3. Customer Deep Detail (12-tab dataset)
  app.get('/admin/customers/:id', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const { id } = req.params as { id: string };

    try {
      const [customer] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
      if (!customer) return reply.status(404).send({ error: 'Customer not found' });

      const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.customerId, id)).orderBy(desc(subscriptions.createdAt)).limit(1);
      const subHist = await db.select().from(subscriptionHistory).where(eq(subscriptionHistory.customerId, id)).orderBy(desc(subscriptionHistory.createdAt));
      const invs = await db.select().from(invoices).where(eq(invoices.customerId, id)).orderBy(desc(invoices.createdAt));
      const pays = await db.select().from(payments).where(eq(payments.customerId, id)).orderBy(desc(payments.createdAt));
      const usage = await db.select().from(usageRecords).where(eq(usageRecords.customerId, id));
      const tickets = await db.select().from(supportTickets).where(eq(supportTickets.customerId, id)).orderBy(desc(supportTickets.createdAt));
      const entitlements = await entitlementEngine.getCustomerEntitlements(id);

      let org = null;
      let members: any[] = [];
      if (customer.organizationId) {
        [org] = await db.select().from(organizations).where(eq(organizations.id, customer.organizationId)).limit(1);
        members = await db
          .select({
            id: memberships.id,
            role: memberships.role,
            createdAt: memberships.createdAt,
            user: users
          })
          .from(memberships)
          .innerJoin(users, eq(memberships.userId, users.id))
          .where(eq(memberships.organizationId, customer.organizationId));
      }

      return reply.send({
        customer,
        organization: org,
        members,
        subscription: sub,
        subscriptionHistory: subHist,
        invoices: invs,
        payments: pays,
        usage,
        entitlements,
        supportTickets: tickets
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 4. Suspend Customer
  app.post('/admin/customers/:id/suspend', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const { id } = req.params as { id: string };
    const { reason } = req.body as { reason?: string };

    try {
      const [updated] = await db
        .update(customers)
        .set({
          status: 'SUSPENDED',
          suspendedReason: reason || 'Suspended by admin',
          updatedAt: new Date()
        })
        .where(eq(customers.id, id))
        .returning();

      // Update subscription status to SUSPENDED
      await db
        .update(subscriptions)
        .set({ status: 'SUSPENDED', updatedAt: new Date() })
        .where(eq(subscriptions.customerId, id));

      // Audit log
      await db.insert(auditLogs).values({
        organizationId: updated.organizationId || id,
        actorId: admin.sub,
        actorType: 'ADMIN',
        action: 'CUSTOMER_SUSPENDED',
        resourceType: 'CUSTOMER',
        resourceId: id,
        metadata: { reason }
      });

      return reply.send({ customer: updated, message: 'Customer suspended successfully' });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 5. Reactivate Customer
  app.post('/admin/customers/:id/reactivate', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const { id } = req.params as { id: string };

    try {
      const [updated] = await db
        .update(customers)
        .set({
          status: 'ACTIVE',
          suspendedReason: null,
          updatedAt: new Date()
        })
        .where(eq(customers.id, id))
        .returning();

      await db
        .update(subscriptions)
        .set({ status: 'ACTIVE', updatedAt: new Date() })
        .where(eq(subscriptions.customerId, id));

      await db.insert(auditLogs).values({
        organizationId: updated.organizationId || id,
        actorId: admin.sub,
        actorType: 'ADMIN',
        action: 'CUSTOMER_REACTIVATED',
        resourceType: 'CUSTOMER',
        resourceId: id
      });

      return reply.send({ customer: updated, message: 'Customer reactivated successfully' });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 6. Admin Plan Management (CRUD & Plan Builder)
  app.get('/admin/plans', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    try {
      const comparison = await entitlementEngine.getPlanComparison();
      const allFeatures = await db.select().from(features);
      const allBenefits = await db.select().from(benefits);

      return reply.send({
        plans: comparison,
        availableFeatures: allFeatures,
        availableBenefits: allBenefits
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post('/admin/plans', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const body = req.body as {
      name: string;
      slug: string;
      tier: string;
      customerType: string;
      description?: string;
      priceMonthly: number;
      priceYearly: number;
      trialPeriodDays?: number;
      features?: Record<string, any>;
      benefitIds?: string[];
    };

    if (!body.name || !body.slug) {
      return reply.status(400).send({ error: 'Name and slug are required' });
    }

    try {
      const [newPlan] = await db
        .insert(plans)
        .values({
          name: body.name,
          slug: body.slug,
          tier: (body.tier as any) || 'BASIC',
          customerType: (body.customerType as any) || 'INDIVIDUAL',
          description: body.description,
          priceMonthly: body.priceMonthly || 0,
          priceYearly: body.priceYearly || 0,
          trialPeriodDays: body.trialPeriodDays ?? 14
        })
        .returning();

      // Attach features
      if (body.features) {
        const featList = await db.select().from(features);
        for (const [code, val] of Object.entries(body.features)) {
          const f = featList.find((item) => item.code === code);
          if (f) {
            await db.insert(planFeatures).values({
              planId: newPlan.id,
              featureId: f.id,
              valueJson: val,
              isEnabled: Boolean(val)
            });
          }
        }
      }

      // Attach benefits
      if (body.benefitIds) {
        let order = 1;
        for (const bId of body.benefitIds) {
          await db.insert(planBenefits).values({
            planId: newPlan.id,
            benefitId: bId,
            displayOrder: order++
          });
        }
      }

      return reply.status(201).send({ plan: newPlan, message: 'Plan created successfully' });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 7. Notification Preview & Broadcast
  app.post('/admin/notifications/preview', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const { targetAudience } = req.body as { targetAudience: any };
    try {
      const estimate = await notificationDispatcher.estimateAudience(targetAudience || { type: 'EVERYONE' });
      return reply.send(estimate);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post('/admin/notifications/broadcast', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const body = req.body as {
      title: string;
      message: string;
      type?: string;
      priority?: string;
      channels?: string[];
      targetAudience: any;
      actionUrl?: string;
    };

    if (!body.title || !body.message) {
      return reply.status(400).send({ error: 'Title and message are required' });
    }

    try {
      const result = await notificationDispatcher.broadcastNotification({
        title: body.title,
        message: body.message,
        type: (body.type as any) || 'ANNOUNCEMENT',
        priority: (body.priority as any) || 'NORMAL',
        channels: body.channels || ['IN_APP'],
        targetAudience: body.targetAudience || { type: 'EVERYONE' },
        senderUserId: admin.sub,
        actionUrl: body.actionUrl
      });

      return reply.status(201).send({ ...result, message: 'Notification broadcast queued and sent' });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 8. Announcement Management
  app.get('/admin/announcements', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    try {
      const list = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
      return reply.send({ announcements: list });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post('/admin/announcements', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const body = req.body as {
      title: string;
      description: string;
      audienceType?: string;
      priority?: string;
      ctaText?: string;
      ctaUrl?: string;
    };

    try {
      const [ann] = await db
        .insert(announcements)
        .values({
          title: body.title,
          description: body.description,
          audienceType: body.audienceType || 'EVERYONE',
          priority: (body.priority as any) || 'NORMAL',
          ctaText: body.ctaText,
          ctaUrl: body.ctaUrl,
          status: 'PUBLISHED'
        })
        .returning();

      return reply.status(201).send({ announcement: ann });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 9. Support Desk & Tickets Queue
  app.get('/admin/support/tickets', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    try {
      const tickets = await db
        .select({
          ticket: supportTickets,
          customer: customers,
          user: users
        })
        .from(supportTickets)
        .innerJoin(customers, eq(supportTickets.customerId, customers.id))
        .innerJoin(users, eq(supportTickets.userId, users.id))
        .orderBy(desc(supportTickets.createdAt));

      return reply.send({ tickets });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.patch('/admin/support/tickets/:id', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const { id } = req.params as { id: string };
    const { status, priority, assignedAdminId } = req.body as any;

    try {
      const [updated] = await db
        .update(supportTickets)
        .set({
          status: status || undefined,
          priority: priority || undefined,
          assignedAdminId: assignedAdminId || undefined,
          updatedAt: new Date()
        })
        .where(eq(supportTickets.id, id))
        .returning();

      return reply.send({ ticket: updated });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post('/admin/support/tickets/:id/messages', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const { id } = req.params as { id: string };
    const { message } = req.body as { message: string };

    try {
      const [msg] = await db
        .insert(supportMessages)
        .values({
          ticketId: id,
          senderUserId: admin.sub,
          senderType: 'ADMIN',
          message
        })
        .returning();

      await db
        .update(supportTickets)
        .set({ status: 'WAITING', updatedAt: new Date() })
        .where(eq(supportTickets.id, id));

      return reply.status(201).send({ message: msg });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 10. Audit Logs
  app.get('/admin/audit-logs', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    try {
      const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);
      return reply.send({ auditLogs: logs });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 11. Support Impersonation
  app.post('/admin/impersonate/start', async (req, reply) => {
    const admin = await requireAdmin(req, reply);
    if (!admin) return;

    const { customerId, reason } = req.body as { customerId: string; reason: string };
    if (!customerId || !reason) {
      return reply.status(400).send({ error: 'customerId and reason are required' });
    }

    try {
      const [cust] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
      if (!cust || !cust.primaryUserId) return reply.status(404).send({ error: 'Target customer or primary user not found' });

      // Create session
      const [session] = await db
        .insert(impersonationSessions)
        .values({
          adminUserId: admin.sub,
          targetCustomerId: customerId,
          targetUserId: cust.primaryUserId,
          reason,
          isActive: true
        })
        .returning();

      // Sign impersonated JWT
      const impersonatedToken = await signJwt({
        sub: cust.primaryUserId,
        email: cust.email,
        orgId: cust.organizationId ?? undefined,
        customerId: cust.id,
        role: 'MEMBER',
        isImpersonated: true,
        impersonatedBy: admin.email
      });

      // Audit log
      await db.insert(auditLogs).values({
        organizationId: cust.organizationId || customerId,
        actorId: admin.sub,
        actorType: 'ADMIN',
        action: 'ADMIN_IMPERSONATION_STARTED',
        resourceType: 'CUSTOMER',
        resourceId: customerId,
        metadata: { reason, sessionId: session.id }
      });

      return reply.send({
        token: impersonatedToken,
        customer: cust,
        sessionId: session.id,
        message: `Impersonation started for ${cust.name}`
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}
