import { pgTable, uuid, varchar, timestamp, text, integer, boolean, doublePrecision, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './tenancy.js';
import { repositories } from './repositories.js';
import { pullRequests } from './pullRequests.js';
import { reviewRuns } from './reviews.js';

export const reviewFindings = pgTable(
  'review_findings',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id, { onDelete: 'cascade' })
      .notNull(),
    repositoryId: uuid('repository_id')
      .references(() => repositories.id, { onDelete: 'cascade' })
      .notNull(),
    pullRequestId: uuid('pull_request_id').references(() => pullRequests.id, { onDelete: 'cascade' }),
    reviewRunId: uuid('review_run_id').references(() => reviewRuns.id, { onDelete: 'cascade' }),
    fingerprint: varchar('fingerprint', { length: 64 }).notNull(),
    severity: varchar('severity', { length: 20 }).notNull(), // CRITICAL, HIGH, MEDIUM, LOW, INFO
    category: varchar('category', { length: 50 }).notNull(), // SECURITY, SECRET, SAST, DEPENDENCY, ARCHITECTURE, LOGIC, etc.
    source: varchar('source', { length: 50 }).notNull(), // DETERMINISTIC, AI, HYBRID
    title: text('title').notNull(),
    description: text('description').notNull(),
    filePath: text('file_path').notNull(),
    startLine: integer('start_line').notNull(),
    endLine: integer('end_line').notNull(),
    evidence: text('evidence'),
    impact: text('impact'),
    recommendation: text('recommendation'),
    ruleId: varchar('rule_id', { length: 100 }),
    policyId: uuid('policy_id'),
    confidence: doublePrecision('confidence').notNull().default(1.0),
    blocking: boolean('blocking').default(false).notNull(),
    status: varchar('status', { length: 30 }).default('OPEN').notNull(), // OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED
    dismissedReason: text('dismissed_reason'),
    dismissedByUserId: uuid('dismissed_by_user_id'),
    dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('findings_org_idx').on(table.organizationId),
    index('findings_repo_idx').on(table.repositoryId),
    index('findings_pr_idx').on(table.pullRequestId),
    index('findings_run_idx').on(table.reviewRunId),
    index('findings_fingerprint_idx').on(table.fingerprint),
    index('findings_severity_idx').on(table.severity),
    index('findings_status_idx').on(table.status)
  ]
);

export const secretFindings = pgTable(
  'secret_findings',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    findingId: uuid('finding_id')
      .references(() => reviewFindings.id, { onDelete: 'cascade' })
      .notNull(),
    secretType: varchar('secret_type', { length: 100 }).notNull(), // AWS_KEY, GITHUB_TOKEN, RSA_PRIVATE_KEY, etc.
    detectedValueHash: varchar('detected_value_hash', { length: 64 }).notNull(),
    maskedPreview: varchar('masked_preview', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('secret_finding_idx').on(table.findingId),
    index('secret_hash_idx').on(table.detectedValueHash)
  ]
);

export const dependencyFindings = pgTable(
  'dependency_findings',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    findingId: uuid('finding_id')
      .references(() => reviewFindings.id, { onDelete: 'cascade' })
      .notNull(),
    packageName: varchar('package_name', { length: 255 }).notNull(),
    currentVersion: varchar('current_version', { length: 100 }).notNull(),
    vulnerableVersionRange: varchar('vulnerable_version_range', { length: 255 }).notNull(),
    cveId: varchar('cve_id', { length: 100 }),
    fixedVersion: varchar('fixed_version', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('dep_finding_idx').on(table.findingId),
    index('dep_cve_idx').on(table.cveId)
  ]
);
