import { pgTable, uuid, varchar, timestamp, text, index, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './tenancy.js';
import { repositories } from './repositories.js';

export const slackIntegrations = pgTable(
  'slack_integrations',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    teamId: varchar('team_id', { length: 100 }).notNull(),
    teamName: varchar('team_name', { length: 255 }).notNull(),
    accessToken: text('access_token').notNull(),
    botUserId: varchar('bot_user_id', { length: 100 }).notNull(),
    defaultChannelId: varchar('default_channel_id', { length: 100 }),
    defaultChannelName: varchar('default_channel_name', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('slack_org_idx').on(table.organizationId)
  ]
);

export const integrationNotifications = pgTable(
  'integration_notifications',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(), // SLACK, EMAIL, WEBHOOK
    channel: varchar('channel', { length: 100 }),
    status: varchar('status', { length: 30 }).default('PENDING').notNull(), // PENDING, SENT, FAILED
    payload: jsonb('payload').notNull(),
    error: text('error'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('int_notif_org_idx').on(table.organizationId),
    index('int_notif_status_idx').on(table.status)
  ]
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    actorType: varchar('actor_type', { length: 50 }).notNull().default('USER'), // USER, SYSTEM, API_KEY
    action: varchar('action', { length: 100 }).notNull(),
    resourceType: varchar('resource_type', { length: 100 }).notNull(),
    resourceId: varchar('resource_id', { length: 255 }).notNull(),
    metadata: jsonb('metadata'),
    ipAddress: varchar('ip_address', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('audit_org_idx').on(table.organizationId),
    index('audit_action_idx').on(table.action),
    index('audit_created_idx').on(table.createdAt)
  ]
);
