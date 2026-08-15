import { pgTable, uuid, varchar, timestamp, text, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './tenancy.js';
import { customers } from './customers.js';

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
    deviceInfo: varchar('device_info', { length: 255 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
    isValid: boolean('is_valid').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('sessions_token_hash_idx').on(table.tokenHash),
    index('sessions_user_idx').on(table.userId)
  ]
);

export const impersonationSessions = pgTable(
  'impersonation_sessions',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    adminUserId: uuid('admin_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    targetCustomerId: uuid('target_customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
    targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    reason: text('reason').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('impersonate_admin_idx').on(table.adminUserId),
    index('impersonate_customer_idx').on(table.targetCustomerId),
    index('impersonate_active_idx').on(table.isActive)
  ]
);
