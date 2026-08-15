import { describe, it, expect } from 'vitest';
import { EntitlementEngine } from './entitlements.js';
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
