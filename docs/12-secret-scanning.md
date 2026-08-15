# Secret Detection & Shannon Entropy Scanner

## Multi-Form Credential Scanner

CodeGuard's `SecretScanner` and `SensitiveDataScanner` detect exposed secrets, API keys, tokens, database credentials, passwords, and sensitive PII across 22+ dedicated regex patterns and Shannon entropy heuristics.

### Supported Secret Patterns
- **AWS**: Access Key IDs (`AKIA...`, `ASIA...`), 40-character Secret Access Keys
- **GitHub & GitLab**: Personal Access Tokens (`ghp_`, `github_pat_`, `glpat-`)
- **Cryptographic Keys**: Unencrypted RSA, EC, DSA, OPENSSH, PGP Private Keys
- **Payment Providers**: Stripe live keys (`sk_live_`, `rk_live_`)
- **AI Model Tokens**: Google Gemini API Keys (`AIzaSy...`), OpenAI (`sk-...`), Anthropic Claude (`sk-ant-...`), HuggingFace (`hf_...`)
- **Databases**: PostgreSQL, MySQL, MongoDB, Redis credentials embedded in URIs (`postgres://user:pass@host:5432/db`)
- **Chat & Webhooks**: Slack bot tokens (`xoxb-`), Slack incoming webhooks, Discord bot tokens/webhooks
- **Cloud Infrastructure**: Azure storage account keys, Supabase JWT service role keys
- **Generic High-Entropy Passwords & JWTs**: Code variable assignments (`password = "..."`, `secret = "..."`) evaluated with Shannon entropy $> 2.8$ to catch bespoke credentials.

### Shannon Entropy Heuristic
$$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
Random alphanumeric secrets produce $H(X) \ge 3.5$, distinguishing real cryptographic secrets from static dummy values.

### Masking & Security
All detected secrets are masked with asterisks in logs and UI (e.g. `AKIA************MPLE`) and stored solely as SHA-256 hashes to prevent secondary credential leakage.
