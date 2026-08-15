import { pgTable, uuid, varchar, timestamp, text, boolean, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { customers } from './customers.js';
import { users } from './tenancy.js';

export const plans = pgTable(
  'plans',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    tier: varchar('tier', { length: 50 }).notNull().default('BASIC'), // BASIC, PRO, ORGANIZATION
    customerType: varchar('customer_type', { length: 50 }).notNull().default('INDIVIDUAL'), // INDIVIDUAL, PROFESSIONAL, ORGANIZATION
    description: text('description'),
    priceMonthly: integer('price_monthly').notNull().default(0), // In minor units e.g. cents / paise
    priceYearly: integer('price_yearly').notNull().default(0),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    trialPeriodDays: integer('trial_period_days').notNull().default(14),
    isActive: boolean('is_active').default(true).notNull(),
    isPublic: boolean('is_public').default(true).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('plan_slug_idx').on(table.slug),
    index('plan_tier_idx').on(table.tier),
    index('plan_active_idx').on(table.isActive)
  ]
);

export const features = pgTable(
  'features',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    code: varchar('code', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }).notNull().default('BOOLEAN'), // BOOLEAN, LIMIT, QUOTA, TEXT, ENUM
    defaultValueJson: jsonb('default_value_json').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('feature_code_idx').on(table.code)
  ]
);

export const benefits = pgTable(
  'benefits',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 100 }).default('check').notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  }
);

export const planFeatures = pgTable(
  'plan_features',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    planId: uuid('plan_id').references(() => plans.id, { onDelete: 'cascade' }).notNull(),
    featureId: uuid('feature_id').references(() => features.id, { onDelete: 'cascade' }).notNull(),
    valueJson: jsonb('value_json').notNull(),
    isEnabled: boolean('is_enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('plan_features_plan_idx').on(table.planId),
    index('plan_features_feature_idx').on(table.featureId),
    uniqueIndex('plan_feature_unique_idx').on(table.planId, table.featureId)
  ]
);

export const planBenefits = pgTable(
  'plan_benefits',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    planId: uuid('plan_id').references(() => plans.id, { onDelete: 'cascade' }).notNull(),
    benefitId: uuid('benefit_id').references(() => benefits.id, { onDelete: 'cascade' }).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('plan_benefits_plan_idx').on(table.planId),
    index('plan_benefits_benefit_idx').on(table.benefitId),
    uniqueIndex('plan_benefit_unique_idx').on(table.planId, table.benefitId)
  ]
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
    planId: uuid('plan_id').references(() => plans.id).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // TRIAL, ACTIVE, PAST_DUE, PAUSED, CANCELLED, EXPIRED, SUSPENDED
    billingInterval: varchar('billing_interval', { length: 20 }).notNull().default('MONTHLY'), // MONTHLY, YEARLY
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).defaultNow().notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    pausedAt: timestamp('paused_at', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('subs_customer_idx').on(table.customerId),
    index('subs_plan_idx').on(table.planId),
    index('subs_status_idx').on(table.status)
  ]
);

export const subscriptionHistory = pgTable(
  'subscription_history',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'cascade' }).notNull(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
    planId: uuid('plan_id').references(() => plans.id).notNull(),
    previousPlanId: uuid('previous_plan_id').references(() => plans.id),
    action: varchar('action', { length: 50 }).notNull(), // CREATED, UPGRADED, DOWNGRADED, RENEWED, PAUSED, CANCELLED, REACTIVATED, SUSPENDED
    reason: text('reason'),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('sub_history_sub_idx').on(table.subscriptionId),
    index('sub_history_customer_idx').on(table.customerId),
    index('sub_history_created_idx').on(table.createdAt)
  ]
);
