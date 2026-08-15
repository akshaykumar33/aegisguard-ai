# CodeGuard — Security & Data Isolation Architecture

## 1. Multi-Tenant Isolation
- **Row-Level Tenancy**: All core tables include `organization_id`.
- **Query Scoping**: Application ORM query builders enforce tenant scoping on every operation.
- **Role-Based Access Control (RBAC)**: Supports roles (`OWNER`, `ADMIN`, `SECURITY_LEAD`, `MEMBER`, `READ_ONLY`).

## 2. Webhook Integrity
- All webhook requests must supply a valid `X-Hub-Signature-256` HMAC signature computed using the GitHub App's webhook secret.
- Constant-time string comparison (`crypto.timingSafeEqual`) prevents timing attacks.

## 3. Secret Protection & Sanitization
- **No Plaintext Secret Storage**: Detected secrets are hashed using SHA-256 (`detected_value_hash`).
- **Masked Previews**: UI and logs display at most 4 characters with the rest redacted (e.g., `ak_live_****...`).
- **Pino Log Redaction**: Central logger automatically strips known secret patterns, tokens, and authorization headers.

## 4. Prompt Injection Defense
- Repository contents are treated as untrusted data.
- System review policies are isolated in system prompts with strict XML demarcation `<untrusted_repo_content>`.
- LLM outputs are forced through strict structured JSON schemas validated with Zod.
