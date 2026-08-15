import { pgTable, uuid, varchar, timestamp, text, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations, users } from './tenancy.js';

export const customerSegments = pgTable(
  'customer_segments',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('customer_segment_slug_idx').on(table.slug)
  ]
);

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    type: varchar('type', { length: 50 }).notNull().default('INDIVIDUAL'), // INDIVIDUAL, PROFESSIONAL, ORGANIZATION
    segmentId: uuid('segment_id').references(() => customerSegments.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    profession: varchar('profession', { length: 100 }).default('Developer'),
    organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
    primaryUserId: uuid('primary_user_id').references(() => users.id, { onDelete: 'set null' }),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'), // ACTIVE, SUSPENDED, PENDING
    suspendedReason: text('suspended_reason'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('customers_email_idx').on(table.email),
    index('customers_org_idx').on(table.organizationId),
    index('customers_user_idx').on(table.primaryUserId),
    index('customers_type_idx').on(table.type),
    index('customers_status_idx').on(table.status)
  ]
);
