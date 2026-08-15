# PHASE 2 PROMPT: Database Persistence & PostgreSQL Row-Level Security (RLS)

## ROLE
Act as a **Staff Database Engineer & Backend Systems Architect**.

## CONTEXT
You are replacing the mock database layer in `@codeguard/database` with production-grade PostgreSQL persistence using **Drizzle ORM** (or raw SQL migrations with typed interfaces) supporting multi-tenant isolation.

## TARGET MODELS & SCHEMAS
Implement schemas for:
1. `organizations`: `id`, `name`, `slug`, `domain`, `plan_id`, `created_at`, `updated_at`.
2. `users`: `id`, `organization_id`, `email`, `name`, `avatar_url`, `role` (`STUDENT`, `PRO`, `ADMIN`, `SECURITY_LEAD`), `created_at`.
3. `repositories`: `id`, `organization_id`, `name`, `provider` (`GITHUB`, `GITLAB`), `external_id`, `is_active`.
4. `policies`: `id`, `organization_id`, `repository_id`, `min_approvals`, `block_on_critical_security`, `entropy_threshold`, `require_pr`.
5. `pull_requests`: `id`, `repository_id`, `pr_number`, `title`, `source_branch`, `target_branch`, `status`, `author`.
6. `reviews`: `id`, `pull_request_id`, `verdict` (`APPROVED`, `CHANGES_REQUESTED`, `BLOCKED`), `model_used`, `execution_time_ms`, `summary`, `created_at`.
7. `findings`: `id`, `review_id`, `title`, `description`, `severity` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), `tool`, `file`, `line_start`, `line_end`, `suggested_fix`.
8. `audit_logs`: `id`, `organization_id`, `actor_id`, `actor_type`, `action`, `resource_type`, `resource_id`, `metadata` (JSONB), `created_at`.
9. `usage_meters`: `id`, `organization_id`, `metric` (`PR_REVIEWS`, `AI_TOKENS`, `SEATS`), `period_start`, `period_end`, `used_count`, `limit_count`.

## INSTRUCTIONS
1. Define typed schemas in `packages/database/src/schema/`.
2. Implement connection pooling with `@neondatabase/serverless` or `pg` with connection retry logic.
3. Enable PostgreSQL Row-Level Security (RLS):
   ```sql
   ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation_policy ON repositories
     FOR ALL
     USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
   ```
4. Provide migration scripts in `packages/database/drizzle/` or `migrations/`.
5. Update `apps/api` and `apps/review-worker` to query the live database with transactional rollbacks on failure.

## ACCEPTANCE CRITERIA
- Automated migrations run cleanly via `pnpm --filter @codeguard/database db:migrate`.
- Multi-tenant isolation test proves that Tenant A cannot query or mutate records owned by Tenant B.
- All monorepo vitest tests continue passing.
