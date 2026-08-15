# CodeGuard Threat Model & Attack Vectors (STRIDE)

## Comprehensive Threat Analysis

CodeGuard protects organizations against internal and external threat actors, malicious PRs, prompt injection, and autonomous AI agents.

| Threat Category | Attack Vector | Adversary Objective | CodeGuard Defense Layer |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Compromised developer credentials or forged AI bot identity | Push unauthorized code or approve own PRs | Mandatory HMAC-signed webhooks, machine identity tracking (`ActorType`), strict prohibition on self-approvals. |
| **Tampering** | Local bypass of pre-commit hooks (`git commit --no-verify`) | Commit secrets or skip linters | **Authoritative Server Principle**: Server-side webhook worker and review pipeline unconditionally re-evaluate all checks. |
| **Repudiation** | Denying authorship of emergency production overrides | Execute unauthorized break-glass merges | Cryptographically hashed, immutable `audit_logs` and `emergency_overrides` with requester email and reason tracking. |
| **Information Disclosure** | Credentials committed to repository (AWS, OpenAI, GitHub tokens, DB URLs) | Exfiltrate production keys | `SecretScanner` + `SensitiveDataScanner` utilizing 22+ regex patterns, Shannon entropy heuristics, and PII detection. |
| **Denial of Service** | Gigantic PR diffs (100k+ lines) or webhook floods | Exhaust review worker resources | Webhook worker rate-limiting, diff size bounding (1MB max), AST token budgets, and distributed BullMQ queues. |
| **Elevation of Privilege** | Prompt injection attacks embedded in source code comments | Trick LLM reviewer into outputting `APPROVE` verdict | Strict XML boundary isolation (`<untrusted_repository_code>`), Zod schema validation, and deterministic policy override. |
