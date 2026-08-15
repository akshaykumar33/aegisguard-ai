import { pgTable, uuid, varchar, timestamp, text, boolean, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('org_slug_idx').on(table.slug)
  ]
);

export const users = pgTable(
  'users',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
    // PBKDF2 hash in `salt:derivedKey` form (see @codeguard/auth hashPassword).
    // Nullable: SSO/OAuth users never set one, and such accounts cannot password-login.
    passwordHash: text('password_hash'),
    // Platform staff flag. Replaces the previous email-substring check, which let
    // anyone self-register their way to super-admin.
    isPlatformAdmin: boolean('is_platform_admin').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('user_email_idx').on(table.email)
  ]
);

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('teams_org_idx').on(table.organizationId),
    uniqueIndex('team_org_slug_idx').on(table.organizationId, table.slug)
  ]
);

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    role: varchar('role', { length: 50 }).notNull().default('MEMBER'), // OWNER, ADMIN, SECURITY_LEAD, MEMBER, READ_ONLY
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('memberships_org_idx').on(table.organizationId),
    index('memberships_user_idx').on(table.userId),
    uniqueIndex('org_user_membership_idx').on(table.organizationId, table.userId)
  ]
);

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    keyPrefix: varchar('key_prefix', { length: 16 }).notNull(),
    hashedKey: text('hashed_key').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('api_keys_org_idx').on(table.organizationId),
    uniqueIndex('api_keys_hash_idx').on(table.hashedKey)
  ]
);
