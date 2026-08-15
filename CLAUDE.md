# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install                      # pnpm 10 workspace (apps/*, packages/*)
pnpm build                        # pnpm -r run build — REQUIRED after a fresh clone (see "dist gotcha")
pnpm typecheck                    # root `tsc --build` across all project references; also emits dist/
pnpm test                         # vitest run — 15 projects, 51 tests, no DB/Redis needed
pnpm test:watch
```

Running a subset of tests:

```bash
npx vitest run packages/policy-engine/src/policy.test.ts   # single file
npx vitest run --project @codeguard/auth                   # one workspace package
npx vitest run -t "blocks critical"                        # by test name
```

Services (each app is started individually; see the port conflict note below):

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d   # postgres(5433, pgvector), redis(6379), minio(9000/9001)
pnpm --filter @codeguard/api dev              # Fastify API + Swagger UI at :3000/docs
pnpm --filter @codeguard/web dev              # Next.js 15 at :3001 (proxies /api/v1/* → :3000)
RUN_WORKER=true pnpm --filter @codeguard/webhook-worker dev
RUN_WORKER=true pnpm --filter @codeguard/review-worker dev
```

Database (Drizzle + postgres-js, all run from `packages/database`):

```bash
pnpm db:generate   # drizzle-kit generate
pnpm db:push       # drizzle-kit push (schema straight to DB)
pnpm db:migrate    # tsx src/migrate.ts
pnpm db:seed       # tsx src/seed.ts
```

End-to-end / AI scripts (`scripts/`, run with `tsx`, hit real GitHub + Gemini):

```bash
npx tsx scripts/triggerLiveReview.ts   # full review pipeline against a real open PR
npx tsx scripts/checkOpenPRs.ts
npx tsx scripts/listGeminiModels.ts    # verify which Gemini models the key can reach
pnpm demo:review                       # offline pipeline demo (apps/review-worker/src/demo.ts)
```

There is no repo-wide linter. Only `@codeguard/cli` (`eslint src/`) and `@codeguard/web` (`next lint`) define `lint` scripts.

## Architecture

A PR review is a **queue-driven pipeline**, not a request/response path. The interesting code is almost entirely in `apps/review-worker/src/processor.ts` — read that first; every `packages/*` module exists to serve one stage of it.

```
GitHub webhook → webhook-worker (HMAC verify, :PORT+1)
                     ↓ enqueueReviewJob, jobId = review:{repoId}:{prNumber}:{headSha}
                 BullMQ pr.review.queue (Redis)
                     ↓ concurrency 5
                 review-worker processReviewJob()
                     ↓
   fetch diff → parse → deterministic scan → graph/context → Gemini → verify → policy → persist → GitHub
```

The stages inside `processReviewJob`, each wrapped in `recordStage()` which writes a `review_stages` row:

1. **INGESTION** — `@codeguard/github` `githubProvider` fetches the unified diff; `@codeguard/code-parser` `parseUnifiedDiff` produces `DiffFile[]` plus a `filePath → changedLineNumbers` map that later stages depend on.
2. **SECRET_SCAN** — `@codeguard/security-scanner` `securityOrchestrator.scanFiles` runs secret / sensitive-data / SAST / dependency scanners. Purely deterministic and in-memory (Shannon entropy in `secretScanner.ts`, `calculateShannonEntropy`); these findings carry `source: 'DETERMINISTIC'` and bypass AI verification.
3. **Context assembly** — `SymbolExtractor` extracts symbols, `@codeguard/code-graph` `CodeGraphStore` supplies caller/callee edges, and `@codeguard/retrieval` `HybridRetriever.assembleContext` flattens changed files + symbols + call graph + active DB policies into `formattedPromptContext`.
4. **AI_ANALYSIS** — `@codeguard/ai-reviewer` `geminiReviewClient` calls the Gemini REST API directly (raw `fetch`, not the SDK) with a **model cascade**: `AI_DEFAULT_MODEL` → `gemini-2.5-flash` → `gemini-3.7-flash` → `gemini-3.5-flash`, 45s timeout each, falling through on failure. Diff is truncated to 8k chars, context to 4k. `promptDefense.ts` holds the system policy, prompt-injection defenses, and the Zod response schema.
5. **AI verification** — `@codeguard/ai-verifier` `AiVerifier.verifyFindings` is the anti-hallucination gate: it drops findings on files not in the diff, findings >5 lines from a changed line, and findings with `confidence < 0.7`; confidence in `[0.7, 0.9)` on CRITICAL/HIGH is downgraded to a non-blocking MEDIUM `[Advisory]`.
6. **Policy evaluation** — `@codeguard/policy-engine` `PolicyEngine.evaluate` maps the merged finding set to `BLOCK` / `WARN` / `PASS`. Falls back to a hardcoded default policy (block secrets, block CRITICAL) when the org has none.
7. **Persist + publish** — writes `review_runs` / `review_findings`, updates the GitHub check run, and posts a review (`REQUEST_CHANGES` when blocked) with up to 5 inline comments. `formatReviewSummaryMarkdown` (exported and unit-tested separately) builds the whole markdown body.

`scripts/triggerLiveReview.ts` re-implements this same sequence standalone, so changes to the pipeline usually need to land in both places.

### Package layering

Dependencies flow one way: `types` → `config` → `logger` → `database` → everything else. `types` and `config` have no workspace dependencies; `ai-verifier`, `code-graph`, `code-parser`, `security-scanner` depend only on `types`/`logger` and are pure/in-memory (hence trivially testable without infra). `retrieval` and `ai-reviewer` sit on top of the graph/parser layer. Apps compose; packages never import from `apps/`.

### Multi-tenancy and auth

Every domain table carries `organizationId`, and every route filters by it. `apps/api/src/middleware/tenantAuth.ts` resolves a `TenantContext` from either `X-API-Key` (hashed lookup against `api_keys`) or a `Bearer` JWT (`jose`, in `@codeguard/auth`), then attaches it to `request.tenant` via Fastify module augmentation. `@codeguard/auth` also owns `ROLE_HIERARCHY` / `ROLE_PERMISSIONS`; add new permissions there rather than checking roles inline in routes.

## Conventions and gotchas

- **`dist` gotcha.** Most packages' `exports.import` point at `./src/index.ts` (tsx/vitest resolve TypeScript source directly), but `@codeguard/types`, `@codeguard/policy-engine`, and `@codeguard/security-scanner` point at `./dist/index.js`. `dist/` is gitignored, so a fresh clone must run `pnpm build` (or `pnpm typecheck`, which also emits) before anything that imports those three will run. `packages/cli/bin/*.js` likewise imports from `../dist/index.js`.
- **NodeNext ESM.** All packages are `"type": "module"` with `module: NodeNext`. Relative imports must carry the `.js` extension even in `.ts` sources (`./routes/health.js`).
- **Config never throws on a missing `.env`.** `packages/config` walks up 5 directories to find `.env`, then parses with Zod where *every* variable has a development default (including `GITHUB_APP_PRIVATE_KEY: 'mock-private-key'` and `JWT_SECRET`). Services therefore start and tests pass with no environment at all — a missing key surfaces as degraded behavior (e.g. `geminiReviewClient` returns a simulated review when `GEMINI_API_KEY` is empty), not a startup error. Adding a required variable means adding it to the Zod schema in `packages/config/src/index.ts`.
- **`.env.example` disagrees with the code defaults.** It ships `postgresql://...@localhost:5432/aegisguard_dev`, while `packages/config` defaults to port **5433** / `codeguard_dev` and that is what `docker-compose.yml` publishes. Trust the config/compose values locally.
- **Port collision under `pnpm dev`.** The root `dev` script runs everything in parallel, but `webhook-worker` binds `config.PORT + 1` = **3001**, which is also the Next.js port. Start apps individually, or set `PORT` for the webhook worker.
- **Queue idempotency.** Every enqueue in `packages/queue` uses a deterministic `jobId` (`review:{repositoryId}:{prNumber}:{headSha}`, `webhook:{provider}:{deliveryId}`) so GitHub webhook retries dedupe rather than double-review. Preserve that when adding queues. `redisConnection` is `lazyConnect` and disables retries under `NODE_ENV=test`, which is why the suite runs without Redis.
- **Webhook signature verification is production-only.** `handleGitHubWebhook` rejects a bad HMAC only when `NODE_ENV === 'production'`, so local deliveries can be replayed unsigned. The raw body needed for HMAC is captured by a custom Fastify `application/json` content-type parser in `apps/webhook-worker/src/index.ts` — parsing the body any other way breaks verification.
- **The web app is demo-resilient by design.** `apps/web/lib/api.ts` wraps each `fetch` in a try/catch that falls back to exported `MOCK_*` fixtures and merges partial API responses over them. Dashboards therefore render fully populated with the API down; when debugging "wrong data", check whether the mock path was taken. There are no tests for `apps/web`.
- **Naming.** Code, packages, and the DB use **CodeGuard** / `@codeguard/*`; `README.md` and `.env.example` brand the product **AegisGuard AI**. Both refer to the same system — keep package identifiers as `@codeguard/*`.
- **Conventional Commits & Clean History.** Follow `type(scope): subject` with descriptive bulleted bodies. Create small, granular, logical commits.
- **AI Agent Governance & Attribution.** See `AGENTS.md` for mandatory rules:
  - **NO SELF CO-AUTHORING**: NEVER add `Co-authored-by: AI / Assistant / Claude` or credit AI entities in commits/PRs. All work is authored solely by the developer.
  - **ZERO DESTRUCTIVE COMMANDS**: Never run `git reset --hard`, `git clean -fdx`, or drop data without explicit human instructions.
  - **ZERO-TRUST CONFIDENTIALITY**: Never print, log, leak, or commit real API keys, secrets, private tokens, or customer PII. Always use synthetic mocks.

## Reference docs

`docs/` holds 28 numbered design documents plus `docs/architecture/`, `docs/api/openapi.yaml`, and `docs/operations/`. They describe the intended full system (including AWS deployment and pgvector-backed retrieval) and run ahead of the implementation in places — treat the code as authoritative. `prompts/execution/` contains the phased roadmap for the remaining SaaS build-out.
