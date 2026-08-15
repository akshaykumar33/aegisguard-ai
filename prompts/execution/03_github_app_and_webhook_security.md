# PHASE 3 PROMPT: GitHub App Integration & Webhook Security Hardening

## ROLE
Act as a **Staff Security Engineer & Developer Integrations Specialist**.

## CONTEXT
You are implementing the production GitHub App integration for CodeGuard AI, connecting repository webhooks directly to the `apps/webhook-worker` queue with cryptographic HMAC verification and GitHub Checks API updates.

## TARGET SPECIFICATIONS
1. **GitHub App Manifest**:
   - Permissions: `pull_requests: write`, `contents: read`, `checks: write`, `metadata: read`.
   - Events subscribed: `pull_request.opened`, `pull_request.synchronize`, `pull_request.reopened`, `check_suite.requested`.
2. **Cryptographic HMAC SHA-256 Verification**:
   - Verify `X-Hub-Signature-256` using constant-time comparison `crypto.timingSafeEqual` in `@codeguard/github`.
   - Reject unauthenticated or tampered payloads with HTTP 401 Unauthorized.
3. **Replay & Idempotency Protection**:
   - Store incoming `X-GitHub-Delivery` UUIDs in Redis with a 24-hour TTL (`SET delivery_id 1 EX 86400 NX`).
   - Discard duplicate deliveries gracefully without re-triggering AI worker jobs.
4. **GitHub Checks API Status Reporter**:
   - Update PR status checks: `queued` -> `in_progress` -> `completed` (`success` | `failure` | `neutral`).
   - Embed inline Markdown review findings directly on diff lines with suggested fixes.

## ACCEPTANCE CRITERIA
- Unit tests verify HMAC signature verification with valid and forged secrets.
- Replay test confirms duplicate deliveries are ignored.
- Full PR review cycle completes and updates GitHub status check with zero latency bottlenecks.
