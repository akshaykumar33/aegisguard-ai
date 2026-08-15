import { pgTable, uuid, varchar, timestamp, text, integer, boolean, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './tenancy.js';
import { repositories } from './repositories.js';

export const pullRequests = pgTable(
  'pull_requests',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    number: integer('number').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    state: varchar('state', { length: 20 }).notNull().default('OPEN'), // OPEN, CLOSED, MERGED
    sourceBranch: varchar('source_branch', { length: 255 }).notNull(),
    targetBranch: varchar('target_branch', { length: 255 }).notNull(),
    headSha: varchar('head_sha', { length: 64 }).notNull(),
    baseSha: varchar('base_sha', { length: 64 }).notNull(),
    authorUsername: varchar('author_username', { length: 255 }).notNull(),
    isDraft: boolean('is_draft').default(false).notNull(),
    openedAt: timestamp('opened_at', { withTimezone: true }).defaultNow().notNull(),
    mergedAt: timestamp('merged_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('pr_org_idx').on(table.organizationId),
    index('pr_repo_idx').on(table.repositoryId),
    uniqueIndex('pr_repo_number_idx').on(table.repositoryId, table.number)
  ]
);

export const pullRequestFiles = pgTable(
  'pull_request_files',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    pullRequestId: uuid('pull_request_id')
      .references(() => pullRequests.id, { onDelete: 'cascade' })
      .notNull(),
    filePath: text('file_path').notNull(),
    oldFilePath: text('old_file_path'),
    status: varchar('status', { length: 20 }).notNull(), // added, modified, deleted, renamed
    additions: integer('additions').notNull().default(0),
    deletions: integer('deletions').notNull().default(0),
    patch: text('patch'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('pr_files_pr_idx').on(table.pullRequestId),
    uniqueIndex('pr_file_path_idx').on(table.pullRequestId, table.filePath)
  ]
);

export const pullRequestCommits = pgTable(
  'pull_request_commits',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    pullRequestId: uuid('pull_request_id')
      .references(() => pullRequests.id, { onDelete: 'cascade' })
      .notNull(),
    sha: varchar('sha', { length: 64 }).notNull(),
    message: text('message').notNull(),
    authorUsername: varchar('author_username', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('pr_commits_pr_idx').on(table.pullRequestId),
    uniqueIndex('pr_commit_sha_idx').on(table.pullRequestId, table.sha)
  ]
);
