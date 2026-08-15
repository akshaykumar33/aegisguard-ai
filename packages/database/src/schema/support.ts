import { pgTable, uuid, varchar, timestamp, text, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './tenancy.js';
import { customers } from './customers.js';

export const supportTickets = pgTable(
  'support_tickets',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    ticketNumber: varchar('ticket_number', { length: 50 }).notNull().unique(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    subject: varchar('subject', { length: 255 }).notNull(),
    description: text('description').notNull(),
    category: varchar('category', { length: 100 }).notNull().default('TECHNICAL'), // TECHNICAL, BILLING, FEATURE_REQUEST, ACCOUNT, GENERAL
    priority: varchar('priority', { length: 20 }).notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, URGENT
    status: varchar('status', { length: 50 }).notNull().default('OPEN'), // OPEN, IN_PROGRESS, WAITING, RESOLVED, CLOSED
    assignedAdminId: uuid('assigned_admin_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('ticket_number_idx').on(table.ticketNumber),
    index('support_customer_idx').on(table.customerId),
    index('support_user_idx').on(table.userId),
    index('support_status_idx').on(table.status)
  ]
);

export const supportMessages = pgTable(
  'support_messages',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    ticketId: uuid('ticket_id').references(() => supportTickets.id, { onDelete: 'cascade' }).notNull(),
    senderUserId: uuid('sender_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    senderType: varchar('sender_type', { length: 50 }).notNull().default('CUSTOMER'), // CUSTOMER, ADMIN
    message: text('message').notNull(),
    attachmentsJson: jsonb('attachments_json').default([]).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('support_messages_ticket_idx').on(table.ticketId),
    index('support_messages_created_idx').on(table.createdAt)
  ]
);
