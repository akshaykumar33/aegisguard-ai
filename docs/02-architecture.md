# CodeGuard Platform Architecture

## Monorepo & Package Architecture

The CodeGuard platform is organized as a high-performance TypeScript monorepo managed via pnpm workspaces and strict project references.

```
/apps
  /api                  - Fastify REST Control Plane & Dashboard UI
  /webhook-worker       - BullMQ Webhook event receiver & HMAC verifier
  /review-worker        - Asynchronous Review Pipeline Worker (AST, SAST, AI, Verification)
/packages
  /types                - Canonical data models, entities, and merge evaluation interfaces
  /config               - Strongly-typed Zod environment configuration
  /logger               - Structured JSON Pino logger with correlation IDs
  /database             - PostgreSQL schema & Drizzle ORM client
  /queue                - Redis & BullMQ queue client & event producers
  /auth                 - JWT & multi-tenant organization authorization
  /code-parser          - Tree-sitter AST & unified diff parser
  /code-graph           - In-memory symbol, class, and call-graph storage
  /retrieval            - Hybrid ranking & architectural context assembler
  /security-scanner     - Shannon entropy secret detection, PII scanner, SAST & dependency rules
  /ai-reviewer          - LLM client with structured output schemas & prompt defense
  /ai-verifier          - Anti-hallucination verification & patch validator
  /policy-engine        - Authoritative merge gate, CODEOWNERS engine, signing, and drift detection
  /github               - GitHub, GitLab, and Bitbucket provider adapters & remediators
  /cli                  - `codeguard` and `orgcode` developer and machine CLI binaries
```

---

## Data Flow & Lifecycle

1. **Pull Request Event Ingestion**:
   GitHub/GitLab fires a webhook (`pull_request.opened`, `pull_request.synchronize`). The `/api/webhooks` endpoint validates cryptographic HMAC signatures before enqueuing a high-priority review job into BullMQ.
2. **Deterministic Scan Phase**:
   The review worker parses unified diffs and inspects all modified files using `SecurityOrchestrator` (`SecretScanner`, `SensitiveDataScanner`, `SastScanner`, `DependencyScanner`).
3. **AST & Call-Graph Context Extraction**:
   `Tree-sitter` extracts symbols, function definitions, caller/callee relations, and architectural neighbors to ground LLM reasoning in the whole repository.
4. **LLM Analysis & Verification**:
   The prompt encapsulates diffs within secure XML boundaries `<untrusted_repository_code>`. LLM responses are parsed into structured JSON with 1-click replacement suggestions. The `AiVerifier` checks suggestions against unified diffs to eliminate hallucinations.
5. **Merge Decision & Policy Enforcement**:
   The `PolicyEngine` evaluates the repository's signed branch policy, ensuring required status checks, CODEOWNERS rules, and minimum human peer approvals are met.
