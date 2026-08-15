import { db, customers, plans, features, benefits, planFeatures, planBenefits, subscriptions, usageRecords, usageLimits } from '@codeguard/database';
import { eq, and, sql, desc } from 'drizzle-orm';
import type { CustomerEntitlements, PlanTier, PlanWithDetails } from '@codeguard/types';
import { logger } from '@codeguard/logger';

export class EntitlementEngine {
  /**
   * Check if a customer has a boolean or non-zero entitlement enabled.
   */
  async has(customerId: string, featureCode: string): Promise<boolean> {
    try {
      const entitlements = await this.getCustomerEntitlements(customerId);
      if (entitlements.status === 'SUSPENDED' || entitlements.status === 'CANCELLED' || entitlements.status === 'EXPIRED') {
        return false;
      }
      const val = entitlements.features[featureCode];
      if (typeof val === 'boolean') return val;
      if (typeof val === 'number') return val > 0;
      return Boolean(val);
    } catch (err) {
      logger.error({ err, customerId, featureCode }, 'Error checking entitlement');
      return false;
    }
  }

  /**
   * Get the configured numerical limit for a feature (checks custom limit overrides first).
   */
  async getLimit(customerId: string, featureCode: string): Promise<number | null> {
    try {
      // 1. Check custom overrides
      const [custom] = await db
        .select()
        .from(usageLimits)
        .where(and(eq(usageLimits.customerId, customerId), eq(usageLimits.featureCode, featureCode)))
        .limit(1);

      if (custom && custom.customLimit !== undefined) {
        return custom.customLimit;
      }

      // 2. Resolve plan limit
      const entitlements = await this.getCustomerEntitlements(customerId);
      return entitlements.limits[featureCode] ?? null;
    } catch (err) {
      logger.error({ err, customerId, featureCode }, 'Error retrieving limit');
      return null;
    }
  }

  /**
   * Determine if a customer can consume a given amount of a quota-governed feature.
   */
  async canConsume(
    customerId: string,
    featureCode: string,
    amount: number = 1
  ): Promise<{ allowed: boolean; current: number; limit: number; remaining: number; percentage: number }> {
    const limit = (await this.getLimit(customerId, featureCode)) ?? 0;
    const current = await this.getCurrentUsage(customerId, featureCode);
    const remaining = Math.max(0, limit - current);
    const allowed = limit === 0 ? false : (current + amount) <= limit;
    const percentage = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 100;

    return {
      allowed,
      current,
      limit,
      remaining,
      percentage
    };
  }

  /**
   * Record consumption of a metered feature into usage_records.
   */
  async recordUsage(customerId: string, featureCode: string, amount: number = 1): Promise<void> {
    const periodKey = this.getCurrentPeriodKey(featureCode);
    const limit = await this.getLimit(customerId, featureCode);

    await db
      .insert(usageRecords)
      .values({
        customerId,
        featureCode,
        periodKey,
        quantity: amount,
        limit: limit ?? undefined
      })
      .onConflictDoUpdate({
        target: [usageRecords.customerId, usageRecords.featureCode, usageRecords.periodKey],
        set: {
          quantity: sql`${usageRecords.quantity} + ${amount}`,
          updatedAt: new Date()
        }
      });
  }

  /**
   * Get current usage counter for customer and feature in the active cycle.
   */
  async getCurrentUsage(customerId: string, featureCode: string): Promise<number> {
    const periodKey = this.getCurrentPeriodKey(featureCode);
    const [rec] = await db
      .select()
      .from(usageRecords)
      .where(
        and(
          eq(usageRecords.customerId, customerId),
          eq(usageRecords.featureCode, featureCode),
          eq(usageRecords.periodKey, periodKey)
        )
      )
      .limit(1);

    return rec ? rec.quantity : 0;
  }

  /**
   * Get full entitlement payload for a customer based on their active subscription and plan.
   */
  async getCustomerEntitlements(customerId: string): Promise<CustomerEntitlements> {
    // 1. Fetch customer & active subscription
    const [customer] = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.customerId, customerId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    let planId: string | null = sub?.planId ?? null;

    // Default fallback to Basic Plan if no active subscription
    if (!planId) {
      const [defaultPlan] = await db.select().from(plans).where(eq(plans.tier, 'BASIC')).limit(1);
      planId = defaultPlan?.id ?? '';
    }

    // 2. Fetch Plan with Features and Benefits
    const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
    const pFeatures = await db
      .select({
        feature: features,
        valueJson: planFeatures.valueJson,
        isEnabled: planFeatures.isEnabled
      })
      .from(planFeatures)
      .innerJoin(features, eq(planFeatures.featureId, features.id))
      .where(eq(planFeatures.planId, planId));

    const pBenefits = await db
      .select({
        benefit: benefits,
        displayOrder: planBenefits.displayOrder
      })
      .from(planBenefits)
      .innerJoin(benefits, eq(planBenefits.benefitId, benefits.id))
      .where(eq(planBenefits.planId, planId))
      .orderBy(planBenefits.displayOrder);

    const featureMap: Record<string, any> = {};
    const limitMap: Record<string, number> = {};

    for (const pf of pFeatures) {
      const code = pf.feature.code;
      if (pf.feature.type === 'BOOLEAN') {
        featureMap[code] = pf.isEnabled && (pf.valueJson === true || pf.valueJson === 'true');
      } else if (pf.feature.type === 'LIMIT' || pf.feature.type === 'QUOTA') {
        const numVal = typeof pf.valueJson === 'number' ? pf.valueJson : parseInt(String(pf.valueJson), 10) || 0;
        featureMap[code] = numVal;
        limitMap[code] = numVal;
      } else {
        featureMap[code] = pf.valueJson;
      }
    }

    return {
      customerId,
      planTier: (plan?.tier as PlanTier) ?? 'BASIC',
      features: featureMap,
      limits: limitMap,
      benefits: pBenefits.map((b) => b.benefit as any),
      status: (sub?.status as any) ?? (customer.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED')
    };
  }

  /**
   * Helper to format period key (monthly or lifetime).
   */
  private getCurrentPeriodKey(featureCode: string): string {
    const isLifetime = featureCode.includes('LIMIT') || featureCode.includes('SEATS') || featureCode.includes('STORAGE');
    if (isLifetime) return 'lifetime';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Retrieve all public plans with attached features and benefits for self-service comparison.
   */
  async getPlanComparison(): Promise<PlanWithDetails[]> {
    const allPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(plans.displayOrder);

    const results: PlanWithDetails[] = [];

    for (const p of allPlans) {
      const pFeatures = await db
        .select({
          feature: features,
          valueJson: planFeatures.valueJson,
          isEnabled: planFeatures.isEnabled
        })
        .from(planFeatures)
        .innerJoin(features, eq(planFeatures.featureId, features.id))
        .where(eq(planFeatures.planId, p.id));

      const pBenefits = await db
        .select({
          benefit: benefits,
          displayOrder: planBenefits.displayOrder
        })
        .from(planBenefits)
        .innerJoin(benefits, eq(planBenefits.benefitId, benefits.id))
        .where(eq(planBenefits.planId, p.id))
        .orderBy(planBenefits.displayOrder);

      results.push({
        ...(p as any),
        features: pFeatures.map((pf) => ({
          feature: pf.feature as any,
          value: pf.valueJson,
          isEnabled: pf.isEnabled
        })),
        benefits: pBenefits.map((b) => b.benefit as any)
      });
    }

    return results;
  }
}

export const entitlementEngine = new EntitlementEngine();
