import { describe, it, expect } from 'vitest';
import { EntitlementEngine, canRunCloudReview } from './entitlements.js';
import { SubscriptionService, MockPaymentProvider } from './billing.js';
import { NotificationDispatcher } from './notifications.js';
import type { CustomerEntitlements } from '@codeguard/types';

describe('Entitlement Engine Unit Tests', () => {
  const engine = new EntitlementEngine();

  it('should instantiate the EntitlementEngine correctly', () => {
    expect(engine).toBeDefined();
    expect(typeof engine.has).toBe('function');
    expect(typeof engine.getLimit).toBe('function');
    expect(typeof engine.canConsume).toBe('function');
  });

  it('should calculate consumption capacity and percentages correctly', async () => {
    // Mock getLimit and getCurrentUsage for a predictable test
    const customEngine = new EntitlementEngine();
    customEngine.getLimit = async () => 100;
    customEngine.getCurrentUsage = async () => 75;

    const result = await customEngine.canConsume('cust-123', 'MONTHLY_PR_REVIEWS', 10);
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(75);
    expect(result.limit).toBe(100);
    expect(result.remaining).toBe(25);
    expect(result.percentage).toBe(75);

    const exceedResult = await customEngine.canConsume('cust-123', 'MONTHLY_PR_REVIEWS', 30);
    expect(exceedResult.allowed).toBe(false);
  });

  it('should evaluate boolean entitlements based on feature map', async () => {
    const customEngine = new EntitlementEngine();
    customEngine.getCustomerEntitlements = async (customerId: string): Promise<CustomerEntitlements> => ({
      customerId,
      planTier: 'PRO',
      features: {
        AI_CODE_REVIEW: true,
        ORG_GOVERNANCE: false,
        USER_SEATS: 1
      },
      limits: {
        USER_SEATS: 1
      },
      benefits: [],
      status: 'ACTIVE'
    });

    const hasAI = await customEngine.has('cust-123', 'AI_CODE_REVIEW');
    const hasOrg = await customEngine.has('cust-123', 'ORG_GOVERNANCE');

    expect(hasAI).toBe(true);
    expect(hasOrg).toBe(false);
  });
});

describe('Cloud review admission gate', () => {
  /** Build an engine whose plan/quota answers are fixed, so no database is touched. */
  function engineFor(options: {
    tier?: 'BASIC' | 'PRO' | 'ORGANIZATION';
    status?: string;
    automatedReview?: boolean;
    used?: number;
    limit?: number;
  }) {
    const engine = new EntitlementEngine();
    const { tier = 'PRO', status = 'ACTIVE', automatedReview = true, used = 0, limit = 500 } = options;

    engine.getCustomerEntitlements = async (customerId: string): Promise<CustomerEntitlements> => ({
      customerId,
      planTier: tier,
      features: { AUTOMATED_PR_REVIEW: automatedReview, MONTHLY_AI_REVIEWS: limit },
      limits: { MONTHLY_AI_REVIEWS: limit },
      benefits: [],
      status: status as CustomerEntitlements['status']
    });
    engine.getLimit = async () => limit;
    engine.getCurrentUsage = async () => used;

    return engine;
  }

  const linkedCustomer = async () => 'cust-1';

  it('admits an in-plan organization with quota remaining', async () => {
    const result = await canRunCloudReview('org-1', {
      resolveCustomer: linkedCustomer,
      engine: engineFor({ used: 10, limit: 500 })
    });

    expect(result.allowed).toBe(true);
    expect(result.customerId).toBe('cust-1');
  });

  it('denies an organization with no billing account linked', async () => {
    const result = await canRunCloudReview('org-unknown', {
      resolveCustomer: async () => null,
      engine: engineFor({})
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/no billing account/i);
  });

  it('denies a BASIC plan that does not include automated PR review', async () => {
    const result = await canRunCloudReview('org-1', {
      resolveCustomer: linkedCustomer,
      engine: engineFor({ tier: 'BASIC', automatedReview: false, limit: 0 })
    });

    expect(result.allowed).toBe(false);
    expect(result.featureCode).toBe('AUTOMATED_PR_REVIEW');
    expect(result.reason).toMatch(/upgrade to pro/i);
  });

  it('denies a suspended subscription', async () => {
    const result = await canRunCloudReview('org-1', {
      resolveCustomer: linkedCustomer,
      engine: engineFor({ status: 'SUSPENDED' })
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/suspended/i);
  });

  it('denies once the monthly AI review quota is exhausted', async () => {
    const result = await canRunCloudReview('org-1', {
      resolveCustomer: linkedCustomer,
      engine: engineFor({ used: 500, limit: 500 })
    });

    expect(result.allowed).toBe(false);
    expect(result.featureCode).toBe('MONTHLY_AI_REVIEWS');
    expect(result.current).toBe(500);
    expect(result.limit).toBe(500);
  });

  it('admits the final review before the quota boundary', async () => {
    const result = await canRunCloudReview('org-1', {
      resolveCustomer: linkedCustomer,
      engine: engineFor({ used: 499, limit: 500 })
    });

    expect(result.allowed).toBe(true);
  });
});

describe('Billing & Subscription Service Unit Tests', () => {
  it('should process mock payments via MockPaymentProvider', async () => {
    const provider = new MockPaymentProvider();
    const result = await provider.processPayment({
      customerId: 'cust-123',
      amount: 2900,
      currency: 'USD',
      paymentMethod: 'CARD'
    });

    expect(result.status).toBe('SUCCEEDED');
    expect(result.transactionId).toContain('txn_mock_');
  });
});

describe('Notification Dispatcher Unit Tests', () => {
  it('should provide formatted audience estimation descriptions', async () => {
    const dispatcher = new NotificationDispatcher();
    // Mock resolveRecipients to avoid live DB call in unit test
    (dispatcher as any).resolveRecipients = async (target: any) => {
      if (target.type === 'PLAN') return [{ userId: 'u1', customerId: 'c1' }, { userId: 'u2', customerId: 'c2' }];
      return [{ userId: 'u1', customerId: 'c1' }];
    };

    const everyoneDesc = await dispatcher.estimateAudience({ type: 'EVERYONE' });
    expect(everyoneDesc.description).toBe('All active users across the platform');
    expect(everyoneDesc.count).toBe(1);

    const proDesc = await dispatcher.estimateAudience({ type: 'PLAN', value: 'PRO' });
    expect(proDesc.description).toBe('Subscribers on plan tier PRO');
    expect(proDesc.count).toBe(2);
  });
});
