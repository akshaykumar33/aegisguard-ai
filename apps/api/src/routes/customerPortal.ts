import { FastifyInstance } from 'fastify';
import {
  db,
  customers,
  subscriptions,
  plans,
  invoices,
  payments,
  usageRecords,
  supportTickets,
  supportMessages,
  documents,
  users
} from '@codeguard/database';
import { eq, and, desc } from 'drizzle-orm';
import { verifyJwt } from '@codeguard/auth';
import { entitlementEngine, subscriptionService, notificationDispatcher } from '@codeguard/policy-engine';

export async function customerPortalRoutes(app: FastifyInstance): Promise<void> {
  // Helper to extract customer & user from Bearer Token
  async function resolveAuth(req: any, reply: any) {
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

    if (!customer) {
      reply.status(404).send({ error: 'Customer account not found for user' });
      return null;
    }

    return { user: payload, customer };
  }

  // 1. Overview
  app.get('/customer/overview', async (req, reply) => {
    const auth = await resolveAuth(req, reply);
    if (!auth) return;

    try {
      const entitlements = await entitlementEngine.getCustomerEntitlements(auth.customer.id);
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.customerId, auth.customer.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      const [currentPlan] = sub ? await db.select().from(plans).where(eq(plans.id, sub.planId)).limit(1) : [null];

      // Usage meters
      const usageList = await db
        .select()
        .from(usageRecords)
        .where(eq(usageRecords.customerId, auth.customer.id));

      const meters: Record<string, any> = {};
      for (const u of usageList) {
        const limit = u.limit || entitlements.limits[u.featureCode] || 100;
        const percentage = Math.min(100, Math.round((u.quantity / limit) * 100));
        meters[u.featureCode] = {
          current: u.quantity,
          limit,
          remaining: Math.max(0, limit - u.quantity),
          percentage,
          isWarning: percentage >= 80,
          isExceeded: percentage >= 100
        };
      }

      // Notifications & Announcements
      const notifs = await notificationDispatcher.getUserNotifications(auth.user.sub, 5);
      const unreadCount = notifs.filter((n) => !n.isRead).length;
      const announcements = await notificationDispatcher.getActiveAnnouncements();

      return reply.send({
        customer: auth.customer,
        subscription: sub,
        currentPlan,
        entitlements,
        usageMeters: meters,
        recentNotifications: notifs,
        unreadNotificationsCount: unreadCount,
        announcements
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 2. Subscription & Available Plans
  app.get('/customer/subscription', async (req, reply) => {
    const auth = await resolveAuth(req, reply);
    if (!auth) return;

    try {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.customerId, auth.customer.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      const allPlans = await entitlementEngine.getPlanComparison();

      return reply.send({
        currentSubscription: sub,
        availablePlans: allPlans
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 3. Plan Upgrade / Change
  app.post('/customer/subscription/change', async (req, reply) => {
    const auth = await resolveAuth(req, reply);
    if (!auth) return;

    const { planId, reason } = req.body as { planId: string; reason?: string };
    if (!planId) return reply.status(400).send({ error: 'planId is required' });

    try {
      const updatedSub = await subscriptionService.changePlan(
        auth.customer.id,
        planId,
        auth.user.sub,
        reason || 'Self-service plan change'
      );

      const entitlements = await entitlementEngine.getCustomerEntitlements(auth.customer.id);

      // Trigger notification
      await notificationDispatcher.broadcastNotification({
        title: 'Plan Updated Successfully',
        message: `Your account has been upgraded/switched to the new plan. New features and quotas are now active.`,
        type: 'SUBSCRIPTION',
        priority: 'HIGH',
        channels: ['IN_APP', 'EMAIL'],
        targetAudience: { type: 'INDIVIDUAL', value: auth.customer.id }
      });

      return reply.send({
        subscription: updatedSub,
        entitlements,
        message: 'Plan successfully updated'
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 4. Usage breakdown
  app.get('/customer/usage', async (req, reply) => {
    const auth = await resolveAuth(req, reply);
    if (!auth) return;

    try {
      const records = await db
        .select()
        .from(usageRecords)
        .where(eq(usageRecords.customerId, auth.customer.id));

      const entitlements = await entitlementEngine.getCustomerEntitlements(auth.customer.id);

      return reply.send({
        records,
        entitlementLimits: entitlements.limits
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 5. Billing & Invoices
  app.get('/customer/billing', async (req, reply) => {
    const auth = await resolveAuth(req, reply);
    if (!auth) return;

    try {
      const invoiceList = await subscriptionService.getInvoices(auth.customer.id);
      const paymentList = await subscriptionService.getPayments(auth.customer.id);

      return reply.send({
        invoices: invoiceList,
        payments: paymentList
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 6. Notifications
  app.get('/customer/notifications', async (req, reply) => {
    const auth = await resolveAuth(req, reply);
    if (!auth) return;

    try {
      const notifs = await notificationDispatcher.getUserNotifications(auth.user.sub, 50);
      return reply.send({ notifications: notifs });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post('/customer/notifications/:id/read', async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      await notificationDispatcher.markAsRead(id);
      return reply.send({ success: true });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post('/customer/notifications/read-all', async (req, reply) => {
    const auth = await resolveAuth(req, reply);
    if (!auth) return;

    try {
      await notificationDispatcher.markAllAsRead(auth.user.sub);
      return reply.send({ success: true });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 7. Gated Documents
  app.get('/customer/documents', async (req, reply) => {
    const auth = await resolveAuth(req, reply);
    if (!auth) return;

    try {
      const entitlements = await entitlementEngine.getCustomerEntitlements(auth.customer.id);
      const allDocs = await db.select().from(documents).orderBy(desc(documents.createdAt));

      // Filter based on entitlement and plan tier
      const tierRank: Record<string, number> = { BASIC: 1, PRO: 2, ORGANIZATION: 3 };
      const userTierRank = tierRank[entitlements.planTier] || 1;

      const accessible = allDocs.map((doc) => {
        const requiredRank = tierRank[doc.minPlanTier] || 1;
        const hasEntitlement = !doc.requiredFeatureCode || Boolean(entitlements.features[doc.requiredFeatureCode]);
        const isUnlocked = doc.isPublic || (userTierRank >= requiredRank && hasEntitlement);
        return {
          ...doc,
          isUnlocked,
          requiredTier: doc.minPlanTier
        };
      });

      return reply.send({ documents: accessible });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 8. Support Tickets
  app.get('/customer/support', async (req, reply) => {
    const auth = await resolveAuth(req, reply);
    if (!auth) return;

    try {
      const tickets = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.customerId, auth.customer.id))
        .orderBy(desc(supportTickets.createdAt));

      return reply.send({ tickets });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post('/customer/support', async (req, reply) => {
    const auth = await resolveAuth(req, reply);
    if (!auth) return;

    const body = req.body as { subject: string; description: string; category?: string; priority?: string };
    if (!body.subject || !body.description) {
      return reply.status(400).send({ error: 'subject and description are required' });
    }

    try {
      const ticketNum = `TICK-${Math.floor(Math.random() * 9000 + 1000)}`;
      const [ticket] = await db
        .insert(supportTickets)
        .values({
          ticketNumber: ticketNum,
          customerId: auth.customer.id,
          userId: auth.user.sub,
          subject: body.subject,
          description: body.description,
          category: (body.category as any) || 'TECHNICAL',
          priority: (body.priority as any) || 'MEDIUM',
          status: 'OPEN'
        })
        .returning();

      // Create initial message
      await db.insert(supportMessages).values({
        ticketId: ticket.id,
        senderUserId: auth.user.sub,
        senderType: 'CUSTOMER',
        message: body.description
      });

      return reply.status(201).send({ ticket });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.get('/customer/support/:id', async (req, reply) => {
    const auth = await resolveAuth(req, reply);
    if (!auth) return;

    const { id } = req.params as { id: string };

    try {
      const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(and(eq(supportTickets.id, id), eq(supportTickets.customerId, auth.customer.id)))
        .limit(1);

      if (!ticket) return reply.status(404).send({ error: 'Ticket not found' });

      const messages = await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.ticketId, id))
        .orderBy(supportMessages.createdAt);

      return reply.send({ ticket, messages });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post('/customer/support/:id/messages', async (req, reply) => {
    const auth = await resolveAuth(req, reply);
    if (!auth) return;

    const { id } = req.params as { id: string };
    const { message } = req.body as { message: string };

    if (!message) return reply.status(400).send({ error: 'Message text is required' });

    try {
      const [ticket] = await db
        .select()
        .from(supportTickets)
        .where(and(eq(supportTickets.id, id), eq(supportTickets.customerId, auth.customer.id)))
        .limit(1);

      if (!ticket) return reply.status(404).send({ error: 'Ticket not found' });

      const [msg] = await db
        .insert(supportMessages)
        .values({
          ticketId: id,
          senderUserId: auth.user.sub,
          senderType: 'CUSTOMER',
          message
        })
        .returning();

      // Update ticket updated_at and status
      await db
        .update(supportTickets)
        .set({ status: 'OPEN', updatedAt: new Date() })
        .where(eq(supportTickets.id, id));

      return reply.status(201).send({ message: msg });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}
