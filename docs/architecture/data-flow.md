# CodeGuard — Data Flow & PR Review Pipeline

## 1. End-to-End Review Data Flow

```text
[GitHub PR Event]
       │
       ▼
[Webhook Worker] ──► HMAC Validation & Tenant Lookup ──► Enqueue review:repo:pr:sha
       │
       ▼ (202 Accepted)
[Redis / BullMQ pr.review.queue]
       │
       ▼
[Review Orchestrator Worker]
  ├─► GitHub API: Create Check Run (Status: IN_PROGRESS)
  ├─► GitHub API: Fetch PR Diff & Modified Files
  │
  ├──► [Security Worker] ──► Gitleaks Secret Scan + Semgrep SAST
  │
  ├──► [Index Worker / Graph] ──► Changed Symbols + Caller Graph + pgvector Similarity
  │
  ▼
[AI Review Engine]
  ├─► Synthesizes ReviewContext (Diff + Graph + Policies)
  ├─► Model Routing (Standard vs Deep Reasoning)
  └─► Prompt Injection Defenses -> Candidate Findings
  │
  ▼
[AI Verifier] ──► Validates High-Risk AI Findings
  │
  ▼
[Policy Engine] ──► Evaluates Findings against Org/Repo Rules -> (BLOCK | WARN | ALLOW)
  │
  ▼
[Publication & Notification]
  ├─► GitHub API: Update Check Run (PASSED / FAILED)
  ├─► GitHub API: Post Formatted PR Review & Top Inline Comments
  ├─► BullMQ: Enqueue Slack Alert (`notification.queue`)
  └─► PostgreSQL: Store Review Run, Stages, Findings, and Audit Logs
```

## 2. Idempotency & Replay Prevention
- Job IDs are deterministically hashed: `review:{repositoryId}:{prNumber}:{headSha}`.
- If duplicate webhooks are delivered by GitHub, Redis deduplicates the job.
- When a new commit is pushed to an active PR (`synchronize`), any pending review for the superseded commit is aborted.
