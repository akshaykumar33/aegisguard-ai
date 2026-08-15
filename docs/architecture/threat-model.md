# CodeGuard — Threat Model & Mitigations

## 1. Threat Identification Matrix

| STRIDE Category | Threat Description | Attack Vector | Security Control |
|---|---|---|---|
| **Spoofing** | Attacker spoofs a GitHub PR webhook to trigger unauthorized review actions or tamper with merge status | Forged HTTP POST to `/api/webhooks/github` | `crypto.timingSafeEqual` HMAC-SHA256 signature verification on raw request body. |
| **Tampering** | Malicious actor modifies finding states or bypasses policy blocks | Direct API modification without appropriate role | Strict RBAC middleware, API key signature validation, immutable audit log trail. |
| **Repudiation** | User denies disabling a security policy or dismissing a critical finding | Policy modifications / finding dismissals | Comprehensive audit logging capturing `actor_id`, `org_id`, `action`, `resource_id`, IP, and timestamp. |
| **Information Disclosure** | Leakage of source code or detected credentials to unauthorized tenants or third-party LLMs | Cross-tenant database queries or plaintext logging | Tenant-isolated queries, secret redaction filters, SHA256 hashed secret fingerprints, zero-training LLM policies. |
| **Denial of Service** | Flooding system with oversized PRs or repetitive commits | High-frequency webhook triggers | Redis token-bucket rate limiters per organization/repo, BullMQ queue concurrency caps, review job deduplication. |
| **Elevation of Privilege** | Repository code containing prompt injection instructs AI reviewer to approve PR | Attacker injects instructions into PR diff or code comments | Deterministic policy engine separates authority from AI; AI has no direct merge/approve permissions. |
