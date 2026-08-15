import { pgTable, uuid, varchar, timestamp, text, boolean, integer, index, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations, users } from './tenancy.js';
import { repositories } from './repositories.js';
import { reviewRuns } from './reviews.js';
import { pullRequests } from './pullRequests.js';

export const policies = pgTable(
  'policies',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    version: varchar('version', { length: 50 }).default('1.0.0').notNull(),
    level: varchar('level', { length: 50 }).default('ORGANIZATION').notNull(), // ORGANIZATION, REPOSITORY, BRANCH, DEVELOPER
    isDefault: boolean('is_default').default(false).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('policies_org_idx').on(table.organizationId),
    index('policies_repo_idx').on(table.repositoryId)
  ]
);

export const policyRules = pgTable(
  'policy_rules',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    policyId: uuid('policy_id')
      .references(() => policies.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    ruleType: varchar('rule_type', { length: 50 }).notNull(), // SEVERITY_THRESHOLD, SECRET_BLOCK, SAST_BLOCK, BRANCH_NAMING, etc.
    condition: jsonb('condition').notNull(),
    action: varchar('action', { length: 50 }).notNull(), // ALLOW, WARN, BLOCK, REQUIRE_APPROVAL
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('rules_policy_idx').on(table.policyId)
  ]
);

export const branchPolicies = pgTable(
  'branch_policies',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }),
    pattern: varchar('pattern', { length: 255 }).notNull(), // main, master, production, release/*
    requirePullRequest: boolean('require_pull_request').default(true).notNull(),
    requiredApprovals: integer('required_approvals').default(2).notNull(),
    requireCodeOwners: boolean('require_code_owners').default(true).notNull(),
    requireAiReview: boolean('require_ai_review').default(true).notNull(),
    requireSecurityScan: boolean('require_security_scan').default(true).notNull(),
    requireTests: boolean('require_tests').default(true).notNull(),
    requireSecretScan: boolean('require_secret_scan').default(true).notNull(),
    enforceAdmins: boolean('enforce_admins').default(true).notNull(),
    preventForcePush: boolean('prevent_force_push').default(true).notNull(),
    preventDeletion: boolean('prevent_deletion').default(true).notNull(),
    requireSignedCommits: boolean('require_signed_commits').default(false).notNull(),
    requireLinearHistory: boolean('require_linear_history').default(true).notNull(),
    requiredStatusChecks: jsonb('required_status_checks').default([]).notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('branch_policy_org_idx').on(table.organizationId),
    index('branch_policy_repo_idx').on(table.repositoryId)
  ]
);

export const policyExecutions = pgTable(
  'policy_executions',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    policyId: uuid('policy_id')
      .references(() => policies.id, { onDelete: 'cascade' })
      .notNull(),
    reviewRunId: uuid('review_run_id')
      .references(() => reviewRuns.id, { onDelete: 'cascade' })
      .notNull(),
    outcome: varchar('outcome', { length: 50 }).notNull(), // ALLOW, WARN, BLOCK, REQUIRE_APPROVAL
    reasons: jsonb('reasons').notNull().default([]),
    evaluatedAt: timestamp('evaluated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('exec_policy_idx').on(table.policyId),
    index('exec_review_idx').on(table.reviewRunId)
  ]
);

export const policyViolations = pgTable(
  'policy_violations',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }),
    actorId: varchar('actor_id', { length: 255 }).notNull(),
    actorType: varchar('actor_type', { length: 50 }).notNull(), // DEVELOPER, AI_AGENT, CI_SYSTEM, BOT, ADMIN
    branch: varchar('branch', { length: 255 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(), // DIRECT_PUSH, MERGE, COMMIT
    decision: varchar('decision', { length: 50 }).notNull(), // BLOCKED, WARNED
    reason: text('reason').notNull(),
    policyVersion: varchar('policy_version', { length: 50 }).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('violations_org_idx').on(table.organizationId),
    index('violations_repo_idx').on(table.repositoryId),
    index('violations_actor_idx').on(table.actorId)
  ]
);

export const policyDriftLogs = pgTable(
  'policy_drift_logs',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    branch: varchar('branch', { length: 255 }).notNull(),
    driftStatus: varchar('drift_status', { length: 50 }).notNull(), // IN_SYNC, DRIFTED, REMEDIATED
    expectedRules: jsonb('expected_rules').notNull(),
    actualRules: jsonb('actual_rules').notNull(),
    discrepancies: jsonb('discrepancies').notNull().default([]),
    detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
    remediatedAt: timestamp('remediated_at', { withTimezone: true })
  },
  (table) => [
    index('drift_org_idx').on(table.organizationId),
    index('drift_repo_idx').on(table.repositoryId)
  ]
);

export const emergencyOverrides = pgTable(
  'emergency_overrides',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    branch: varchar('branch', { length: 255 }).notNull(),
    pullRequestId: uuid('pull_request_id').references(() => pullRequests.id, { onDelete: 'cascade' }),
    requesterId: uuid('requester_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    requesterEmail: varchar('requester_email', { length: 255 }).notNull(),
    reason: text('reason').notNull(),
    approvedById: uuid('approved_by_id').references(() => users.id, { onDelete: 'set null' }),
    approvedByEmail: varchar('approved_by_email', { length: 255 }),
    activeUntil: timestamp('active_until', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('emergency_org_idx').on(table.organizationId),
    index('emergency_repo_idx').on(table.repositoryId)
  ]
);
