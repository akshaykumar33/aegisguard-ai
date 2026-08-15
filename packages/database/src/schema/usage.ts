import { pgTable, uuid, varchar, timestamp, text, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { customers } from './customers.js';

export const usageRecords = pgTable(
  'usage_records',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
    featureCode: varchar('feature_code', { length: 100 }).notNull(),
    periodKey: varchar('period_key', { length: 50 }).notNull(), // e.g. '2026-08' or 'lifetime'
    quantity: integer('quantity').notNull().default(0),
    limit: integer('limit'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('usage_customer_idx').on(table.customerId),
    uniqueIndex('usage_customer_feature_period_idx').on(table.customerId, table.featureCode, table.periodKey)
  ]
);

export const usageLimits = pgTable(
  'usage_limits',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
    featureCode: varchar('feature_code', { length: 100 }).notNull(),
    customLimit: integer('custom_limit').notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('custom_limits_customer_idx').on(table.customerId),
    uniqueIndex('custom_limit_unique_idx').on(table.customerId, table.featureCode)
  ]
);
