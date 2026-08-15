# CodeGuard — System Architecture Specification

## 1. Executive Summary
CodeGuard is a multi-tenant DevSecOps & Repository Intelligence Control Plane engineered to inspect every Pull Request across an enterprise GitHub/GitLab organization, enforce deterministic security controls, analyze architectural boundaries through code graphs and AST parsing, synthesize AI review comments, and block non-compliant merges via native branch protection.

## 2. Architectural Pillars
1. **Separation of Deterministic Authority and AI Reasoning**: Deterministic scanners (secrets, SAST, dependency analysis, policy rules) possess authoritative blocking power. AI provides explanatory context, complex logic bug detection, and architectural reasoning.
2. **Strict Multi-Tenancy & Zero Data Leakage**: Every repository, review, finding, symbol, and embedding is scoped by `organization_id`.
3. **Repository Graph Context**: Code changes are not evaluated in isolation; Tree-sitter symbol graphs and pgvector semantic retrieval supply deep structural context.
4. **Resilient Asynchronous Ingestion**: Fast webhook ingestion (sub-100ms response) backed by Redis and BullMQ queues with idempotency guarantees.

## 3. High-Level Subsystems
- **API Gateway (`apps/api`)**: Fastify REST API with Zod validation, JWT/API-key authentication, OpenAPI documentation.
- **Webhook Ingestion (`apps/webhook-worker`)**: Signature-verified endpoint routing PR and push events into BullMQ queues.
- **Review Orchestrator (`apps/review-worker`)**: Coordinates diff retrieval, parallel scanning, graph resolution, AI analysis, policy evaluation, and GitHub Checks/Comments publication.
- **Repository Indexer (`apps/index-worker`)**: Incremental Tree-sitter AST symbol extractor, dependency analyzer, and vector indexer.
- **Security Scanner Engine (`packages/security-scanner`)**: Gitleaks secret detection, Semgrep SAST, and vulnerable dependency checking.
- **AI Reviewer & Verifier (`packages/ai-reviewer`, `packages/ai-verifier`)**: Tiered model routing with prompt-injection defense and verification loops for high-risk findings.
- **Policy Engine (`packages/policy-engine`)**: Authoritative policy evaluator translating scanner and AI findings into ALLOW, WARN, BLOCK, or REQUIRE_APPROVAL decisions.
