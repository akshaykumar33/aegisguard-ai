import { pgTable, uuid, varchar, timestamp, text, integer, index, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './tenancy.js';
import { repositories } from './repositories.js';
import { pullRequests } from './pullRequests.js';

export const reviewRuns = pgTable(
  'review_runs',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    pullRequestId: uuid('pull_request_id')
      .references(() => pullRequests.id, { onDelete: 'cascade' })
      .notNull(),
    commitSha: varchar('commit_sha', { length: 64 }).notNull(),
    state: varchar('state', { length: 50 }).notNull().default('QUEUED'), // QUEUED, SCANNING, ANALYZING, PASSED, BLOCKED, FAILED, etc.
    policyOutcome: varchar('policy_outcome', { length: 50 }), // ALLOW, WARN, BLOCK, REQUIRE_APPROVAL
    summary: text('summary'),
    criticalCount: integer('critical_count').notNull().default(0),
    highCount: integer('high_count').notNull().default(0),
    mediumCount: integer('medium_count').notNull().default(0),
    lowCount: integer('low_count').notNull().default(0),
    infoCount: integer('info_count').notNull().default(0),
    durationMs: integer('duration_ms'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('review_runs_org_idx').on(table.organizationId),
    index('review_runs_repo_idx').on(table.repositoryId),
    index('review_runs_pr_idx').on(table.pullRequestId),
    index('review_runs_state_idx').on(table.state)
  ]
);

export const reviewStages = pgTable(
  'review_stages',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    reviewRunId: uuid('review_run_id')
      .references(() => reviewRuns.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 50 }).notNull(), // INGESTION, SECRET_SCAN, SAST_SCAN, GRAPH_RESOLVER, AI_ANALYSIS, etc.
    status: varchar('status', { length: 50 }).notNull().default('PENDING'), // PENDING, IN_PROGRESS, COMPLETED, FAILED, SKIPPED
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),
    error: text('error'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('review_stages_run_idx').on(table.reviewRunId)
  ]
);
