import { pgTable, uuid, varchar, timestamp, text, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './tenancy.js';
import { customers } from './customers.js';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    type: varchar('type', { length: 50 }).notNull().default('INFO'), // INFO, SUCCESS, WARNING, URGENT, SYSTEM, BILLING, SUBSCRIPTION, SECURITY, ANNOUNCEMENT
    priority: varchar('priority', { length: 20 }).notNull().default('NORMAL'), // NORMAL, HIGH, URGENT
    channelsJson: jsonb('channels_json').default(['IN_APP']).notNull(),
    actionUrl: text('action_url'),
    targetAudienceJson: jsonb('target_audience_json').default({ type: 'EVERYONE' }).notNull(),
    senderUserId: uuid('sender_user_id').references(() => users.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('notifications_type_idx').on(table.type),
    index('notifications_priority_idx').on(table.priority),
    index('notifications_created_idx').on(table.createdAt)
  ]
);

export const notificationRecipients = pgTable(
  'notification_recipients',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    notificationId: uuid('notification_id').references(() => notifications.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    isDismissed: boolean('is_dismissed').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('notif_recip_user_idx').on(table.userId),
    index('notif_recip_customer_idx').on(table.customerId),
    index('notif_recip_unread_idx').on(table.userId, table.isRead)
  ]
);

export const announcements = pgTable(
  'announcements',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    audienceType: varchar('audience_type', { length: 50 }).notNull().default('EVERYONE'), // EVERYONE, STUDENTS, PROFESSIONALS, ORGANIZATIONS, PLAN, CUSTOMER
    targetFilterJson: jsonb('target_filter_json').default({}).notNull(),
    priority: varchar('priority', { length: 20 }).notNull().default('NORMAL'),
    startDate: timestamp('start_date', { withTimezone: true }).defaultNow().notNull(),
    endDate: timestamp('end_date', { withTimezone: true }),
    ctaText: varchar('cta_text', { length: 100 }),
    ctaUrl: text('cta_url'),
    status: varchar('status', { length: 50 }).notNull().default('PUBLISHED'), // DRAFT, PUBLISHED, ARCHIVED
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('announcements_status_idx').on(table.status),
    index('announcements_audience_idx').on(table.audienceType)
  ]
);
