import { pgTable, uuid, varchar, timestamp, text, boolean, uniqueIndex, index, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './tenancy.js';

export const repositories = pgTable(
  'repositories',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    provider: varchar('provider', { length: 50 }).notNull().default('github'), // github, gitlab, bitbucket
    providerRepoId: varchar('provider_repo_id', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    private: boolean('private').default(true).notNull(),
    defaultBranch: varchar('default_branch', { length: 100 }).default('main').notNull(),
    cloneUrl: text('clone_url').notNull(),
    installationId: varchar('installation_id', { length: 255 }).notNull(),
    lastIndexedCommitSha: varchar('last_indexed_commit_sha', { length: 64 }),
    lastIndexedAt: timestamp('last_indexed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('repo_org_idx').on(table.organizationId),
    uniqueIndex('repo_provider_unique_idx').on(table.provider, table.providerRepoId),
    index('repo_full_name_idx').on(table.fullName)
  ]
);

export const repositoryInstallations = pgTable(
  'repository_installations',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    provider: varchar('provider', { length: 50 }).notNull().default('github'),
    installationId: varchar('installation_id', { length: 255 }).notNull().unique(),
    accountName: varchar('account_name', { length: 255 }).notNull(),
    accountId: varchar('account_id', { length: 255 }).notNull(),
    permissions: jsonb('permissions').notNull().default({}),
    suspendedAt: timestamp('suspended_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('repo_inst_org_idx').on(table.organizationId),
    uniqueIndex('inst_id_idx').on(table.installationId)
  ]
);

export const repositoryCommits = pgTable(
  'repository_commits',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    sha: varchar('sha', { length: 64 }).notNull(),
    message: text('message').notNull(),
    authorName: varchar('author_name', { length: 255 }),
    authorEmail: varchar('author_email', { length: 255 }),
    authoredAt: timestamp('authored_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('repo_commits_org_idx').on(table.organizationId),
    index('repo_commits_repo_idx').on(table.repositoryId),
    uniqueIndex('repo_commit_sha_idx').on(table.repositoryId, table.sha)
  ]
);

export const repositoryFiles = pgTable(
  'repository_files',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    commitSha: varchar('commit_sha', { length: 64 }).notNull(),
    path: text('path').notNull(),
    language: varchar('language', { length: 50 }),
    sizeBytes: varchar('size_bytes', { length: 50 }),
    contentHash: varchar('content_hash', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('repo_files_org_idx').on(table.organizationId),
    index('repo_files_repo_idx').on(table.repositoryId),
    uniqueIndex('repo_file_commit_path_idx').on(table.repositoryId, table.commitSha, table.path)
  ]
);

export const repositorySnapshots = pgTable(
  'repository_snapshots',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    commitSha: varchar('commit_sha', { length: 64 }).notNull(),
    s3Key: text('s3_key').notNull(),
    fileCount: varchar('file_count', { length: 50 }),
    symbolCount: varchar('symbol_count', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('repo_snapshots_org_idx').on(table.organizationId),
    uniqueIndex('repo_snapshot_commit_idx').on(table.repositoryId, table.commitSha)
  ]
);
