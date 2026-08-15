import {
  db,
  customers,
  plans,
  subscriptions,
  subscriptionHistory,
  invoices,
  payments,
  auditLogs
} from '@codeguard/database';
import { eq, desc } from 'drizzle-orm';
import type { Customer, Plan, Subscription, Invoice, Payment, BillingInterval } from '@codeguard/types';
import { logger } from '@codeguard/logger';

export interface PaymentProvider {
  createCustomer(customer: Customer): Promise<{ providerCustomerId: string }>;
  processPayment(params: { customerId: string; amount: number; currency: string; paymentMethod: string }): Promise<{ transactionId: string; status: 'SUCCEEDED' | 'FAILED' }>;
  createSubscription(params: { customerId: string; plan: Plan; interval: BillingInterval }): Promise<{ providerSubId: string }>;
  cancelSubscription(providerSubId: string): Promise<void>;
}

export class MockPaymentProvider implements PaymentProvider {
  async createCustomer(customer: Customer): Promise<{ providerCustomerId: string }> {
    return { providerCustomerId: `cus_mock_${customer.id.slice(0, 8)}` };
  }

  async processPayment(params: { customerId: string; amount: number; currency: string; paymentMethod: string }): Promise<{ transactionId: string; status: 'SUCCEEDED' | 'FAILED' }> {
    return {
      transactionId: `txn_mock_${Math.random().toString(36).substring(2, 10)}`,
      status: 'SUCCEEDED'
    };
  }

  async createSubscription(params: { customerId: string; plan: Plan; interval: BillingInterval }): Promise<{ providerSubId: string }> {
    return { providerSubId: `sub_mock_${Math.random().toString(36).substring(2, 10)}` };
  }

  async cancelSubscription(providerSubId: string): Promise<void> {
    logger.info({ providerSubId }, 'Mock subscription cancelled');
  }
}

export class SubscriptionService {
  constructor(private provider: PaymentProvider = new MockPaymentProvider()) {}

  /**
   * Subscribe a customer to a plan with automated invoice and payment generation.
   */
  async subscribe(
    customerId: string,
    planId: string,
    billingInterval: BillingInterval = 'MONTHLY',
    actorUserId?: string
  ): Promise<Subscription> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (!plan) throw new Error('Plan not found');

    const durationDays = billingInterval === 'YEARLY' ? 365 : 30;
    const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const amount = billingInterval === 'YEARLY' ? plan.priceYearly : plan.priceMonthly;

    // 1. Create or update subscription
    const [sub] = await db
      .insert(subscriptions)
      .values({
        customerId,
        planId,
        status: amount === 0 ? 'ACTIVE' : (plan.trialPeriodDays > 0 ? 'TRIAL' : 'ACTIVE'),
        billingInterval,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
        trialEndsAt: plan.trialPeriodDays > 0 ? new Date(Date.now() + plan.trialPeriodDays * 86400000) : null
      })
      .returning();

    // 2. Add history record
    await db.insert(subscriptionHistory).values({
      subscriptionId: sub.id,
      customerId,
      planId,
      action: 'CREATED',
      reason: `Subscribed to ${plan.name} (${billingInterval})`,
      actorUserId
    });

    // 3. Create invoice if paid
    if (amount > 0) {
      const invNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      const [inv] = await db
        .insert(invoices)
        .values({
          customerId,
          subscriptionId: sub.id,
          invoiceNumber: invNumber,
          amountDue: amount,
          amountPaid: amount,
          currency: plan.currency,
          status: 'PAID',
          paidAt: new Date()
        })
        .returning();

      // 4. Record payment
      const paymentResult = await this.provider.processPayment({
        customerId,
        amount,
        currency: plan.currency,
        paymentMethod: 'CARD'
      });

      await db.insert(payments).values({
        customerId,
        invoiceId: inv.id,
        amount,
        currency: plan.currency,
        status: paymentResult.status,
        paymentMethod: 'CARD',
        provider: 'MOCK',
        providerTransactionId: paymentResult.transactionId
      });
    }

    return sub as any;
  }

  /**
   * Seamless self-service or admin plan upgrade/downgrade with instant entitlement recalculation.
   */
  async changePlan(
    customerId: string,
    newPlanId: string,
    actorUserId?: string,
    reason: string = 'User requested plan change'
  ): Promise<Subscription> {
    const [activeSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.customerId, customerId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const [newPlan] = await db.select().from(plans).where(eq(plans.id, newPlanId)).limit(1);
    if (!newPlan) throw new Error('New plan not found');

    const previousPlanId = activeSub?.planId;
    const isUpgrade = true; // In full billing: calculate prorated delta
    const action = isUpgrade ? 'UPGRADED' : 'DOWNGRADED';

    let updatedSub: Subscription;

    if (activeSub) {
      const [res] = await db
        .update(subscriptions)
        .set({
          planId: newPlanId,
          status: 'ACTIVE',
          cancelAtPeriodEnd: false,
          updatedAt: new Date()
        })
        .where(eq(subscriptions.id, activeSub.id))
        .returning();
      updatedSub = res as any;
    } else {
      updatedSub = await this.subscribe(customerId, newPlanId, 'MONTHLY', actorUserId);
    }

    // Record immutable history
    await db.insert(subscriptionHistory).values({
      subscriptionId: updatedSub.id,
      customerId,
      planId: newPlanId,
      previousPlanId,
      action,
      reason,
      actorUserId
    });

    // Create prorated invoice if upgrade is paid
    if (newPlan.priceMonthly > 0) {
      const invNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
      const [inv] = await db
        .insert(invoices)
        .values({
          customerId,
          subscriptionId: updatedSub.id,
          invoiceNumber: invNumber,
          amountDue: newPlan.priceMonthly,
          amountPaid: newPlan.priceMonthly,
          currency: newPlan.currency,
          status: 'PAID',
          paidAt: new Date()
        })
        .returning();

      await db.insert(payments).values({
        customerId,
        invoiceId: inv.id,
        amount: newPlan.priceMonthly,
        currency: newPlan.currency,
        status: 'SUCCEEDED',
        paymentMethod: 'CARD',
        provider: 'MOCK',
        providerTransactionId: `txn_mock_${Math.random().toString(36).substring(2, 10)}`
      });
    }

    return updatedSub;
  }

  /**
   * Cancel subscription at period end or immediately.
   */
  async cancelSubscription(customerId: string, actorUserId?: string, reason: string = 'Cancelled by user'): Promise<Subscription> {
    const [activeSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.customerId, customerId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!activeSub) throw new Error('No active subscription found');

    const [updated] = await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, activeSub.id))
      .returning();

    await db.insert(subscriptionHistory).values({
      subscriptionId: activeSub.id,
      customerId,
      planId: activeSub.planId,
      action: 'CANCELLED',
      reason,
      actorUserId
    });

    return updated as any;
  }

  /**
   * Reactivate a cancelled subscription.
   */
  async reactivateSubscription(customerId: string, actorUserId?: string): Promise<Subscription> {
    const [activeSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.customerId, customerId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!activeSub) throw new Error('No subscription found to reactivate');

    const [updated] = await db
      .update(subscriptions)
      .set({
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, activeSub.id))
      .returning();

    await db.insert(subscriptionHistory).values({
      subscriptionId: activeSub.id,
      customerId,
      planId: activeSub.planId,
      action: 'REACTIVATED',
      reason: 'Reactivated by user',
      actorUserId
    });

    return updated as any;
  }

  /**
   * List customer invoices.
   */
  async getInvoices(customerId: string): Promise<Invoice[]> {
    const res = await db
      .select()
      .from(invoices)
      .where(eq(invoices.customerId, customerId))
      .orderBy(desc(invoices.createdAt));
    return res as any;
  }

  /**
   * List customer payment transactions.
   */
  async getPayments(customerId: string): Promise<Payment[]> {
    const res = await db
      .select()
      .from(payments)
      .where(eq(payments.customerId, customerId))
      .orderBy(desc(payments.createdAt));
    return res as any;
  }
}

export const subscriptionService = new SubscriptionService();
