# CodeGuard AI — Sequential Implementation Prompts

This directory contains the **step-by-step, execution-ready prompts** for engineering teams and AI agents to systematically transition CodeGuard AI from the current verified codebase into a production-grade AWS SaaS platform.

---

## 📋 Prompt Sequence Matrix

| Step | Prompt File | Scope & Workload | Dependencies |
|---|---|---|---|
| **Phase 1** | [`01_aws_cloud_infrastructure_terraform.md`](file:///d:/pro/code-gaurd-reviewer/prompts/execution/01_aws_cloud_infrastructure_terraform.md) | AWS ECS Fargate, Aurora PostgreSQL Serverless v2, ElastiCache Redis, SQS Queues, CloudFront, ALB, WAF v2. | Phase 0 Audit |
| **Phase 2** | [`02_database_persistence_aurora_postgresql.md`](file:///d:/pro/code-gaurd-reviewer/prompts/execution/02_database_persistence_aurora_postgresql.md) | Drizzle ORM schema, PostgreSQL migrations, Row-Level Security (RLS) multi-tenancy, connection pooling. | Phase 1 |
| **Phase 3** | [`03_github_app_and_webhook_security.md`](file:///d:/pro/code-gaurd-reviewer/prompts/execution/03_github_app_and_webhook_security.md) | GitHub App manifest, HMAC SHA-256 signature verification, replay protection, Octokit Checks API. | Phase 1, Phase 2 |
| **Phase 4** | [`04_cli_distribution_and_npm_provenance.md`](file:///d:/pro/code-gaurd-reviewer/prompts/execution/04_cli_distribution_and_npm_provenance.md) | `@codeguard/cli` packaging, automated GitHub Actions release workflow with npm provenance signing. | Packages |
| **Phase 5** | [`05_multi_model_ai_gateway_bedrock_gemini.md`](file:///d:/pro/code-gaurd-reviewer/prompts/execution/05_multi_model_ai_gateway_bedrock_gemini.md) | Multi-provider AI Gateway supporting Google Gemini 3.7 Flash + AWS Bedrock (Claude 3.5 Sonnet) failover. | Phase 2 |
| **Phase 6** | [`06_enterprise_sso_and_audit_governance.md`](file:///d:/pro/code-gaurd-reviewer/prompts/execution/06_enterprise_sso_and_audit_governance.md) | SAML 2.0 / OIDC enterprise SSO, immutable signed audit log export, Break-Glass 24-hour SLA policies. | Phase 2, Phase 3 |

---

## 🎯 How to Use These Prompts

1. Execute prompts sequentially (**Phase 1 → Phase 2 → ... → Phase 6**).
2. Each prompt is self-contained with:
   - **Role & Context**
   - **Target Files to Create/Modify**
   - **Step-by-Step Technical Implementation**
   - **Verification Commands & Automated Tests**
   - **Acceptance Criteria Gates**
3. Verify that all automated tests pass (`pnpm test` and `pnpm build`) after completing each phase before progressing to the next.
