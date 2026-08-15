import { pgTable, uuid, varchar, timestamp, text, boolean, integer, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 100 }).notNull().default('GUIDE'), // GUIDE, REPORT, COMPLIANCE, WHITEPAPER, TEMPLATE, SDK
    fileUrl: text('file_url').notNull(),
    fileSize: integer('file_size').default(0).notNull(), // in bytes
    mimeType: varchar('mime_type', { length: 100 }).default('application/pdf').notNull(),
    requiredFeatureCode: varchar('required_feature_code', { length: 100 }),
    minPlanTier: varchar('min_plan_tier', { length: 50 }).default('BASIC').notNull(), // BASIC, PRO, ORGANIZATION
    isPublic: boolean('is_public').default(false).notNull(),
    downloadCount: integer('download_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('documents_category_idx').on(table.category),
    index('documents_tier_idx').on(table.minPlanTier)
  ]
);
