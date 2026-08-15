<div align="center">

```text
     ___       _______   _______  __       _______.  _______  __    __       ___      .______       _______      ___       __  
    /   \     |   ____| /  _____||  |     /       | /  _____||  |  |  |     /   \     |   _  \     |       \    /   \     |  | 
   /  ^  \    |  |__   |  |  __  |  |    |   (----`|  |  __  |  |  |  |    /  ^  \    |  |_)  |    |  .--.  |  /  ^  \    |  | 
  /  /_\  \   |   __|  |  | |_ | |  |     \   \    |  | |_ | |  |  |  |   /  /_\  \   |      /     |  |  |  | /  /_\  \   |  | 
 /  _____  \  |  |____ |  |__| | |  | .----)   |   |  |__| | |  `--'  |  /  _____  \  |  |\  \----.|  '--'  |/  _____  \  |  | 
/__/     \__\ |_______| \______| |__| |_______/     \______|  \______/  /__/     \__\ | _| `._____||_______/ /__/     \__\ |__| 
```

### **Autonomous Zero-Trust AI Code Governance & PR Verification Platform**

*Deterministic AST Analysis • Shannon Entropy Secret Prevention • Google Gemini 3.7 Flash & AWS Bedrock • Branch Protection Gates*

---

[![CI Status](https://img.shields.io/badge/CI-Passing%20(51%2F51)-emerald?style=for-the-badge&logo=github-actions)](https://github.com/akshaykumar33/aegisguard-ai/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25%20Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7%20(App%20Router)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Gemini 3.7](https://img.shields.io/badge/AI%20Engine-Gemini%203.7%20Flash-violet?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Security](https://img.shields.io/badge/Zero--Trust-SOC2%20Ready-success?style=for-the-badge&logo=shield)](http://localhost:3001/docs)
[![License](https://img.shields.io/badge/License-Apache%202.0-blueviolet?style=for-the-badge)](./LICENSE)

[**Live Web Portal (Port 3001)**](http://localhost:3001) • [**Interactive Documentation (/docs)**](http://localhost:3001/docs) • [**Super Admin CRM (/admin)**](http://localhost:3001/admin) • [**Swagger API (Port 3000)**](http://localhost:3000/docs)

</div>

---

## ⚡ Overview

**AegisGuard AI** is an enterprise developer platform that prevents vulnerabilities, hardcoded secrets, and breaking architecture regressions from ever reaching production branches. 

Combining **pure in-memory Abstract Syntax Tree (AST) symbol graphs**, **mathematical Shannon Entropy calculation**, and **Google Gemini 3.7 Flash AI reasoning**, AegisGuard acts as an autonomous, zero-hallucination code reviewer on every pull request.

---

## 🏛️ System Architecture

```text
                                  ┌──────────────────────────┐
                                  │      CloudFront CDN      │
                                  └─────────────┬────────────┘
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     │                                                     │
                     ▼                                                     ▼
        ┌─────────────────────────┐                           ┌─────────────────────────┐
        │  Next.js 15 Web & Docs  │                           │ Application Load Balancer│
        │    (AWS ECS Fargate)    │                           │      (ALB / WAF v2)     │
        └─────────────────────────┘                           └─────────────┬───────────┘
                                                                            │
                                                ┌───────────────────────────┴───────────────────────────┐
                                                │                                                       │
                                                ▼                                                       ▼
                                   ┌─────────────────────────┐                             ┌─────────────────────────┐
                                   │   Fastify 5 API Pods    │                             │   Webhook Worker Pods   │
                                   │    (Port 3000 REST)     │                             │    (HMAC SHA-256 Auth)  │
                                   └────────────┬────────────┘                             └────────────┬────────────┘
                                                │                                                       │
                                                └───────────────────────────┬───────────────────────────┘
                                                                            │
                                                       ┌────────────────────┴────────────────────┐
                                                       │                                         │
                                                       ▼                                         ▼
                                        ┌─────────────────────────────┐           ┌─────────────────────────────┐
                                        │  Amazon SQS / EventBridge   │           │   ElastiCache Redis 7.0     │
                                        │  (Job Queues & DLQ Retry)   │           │ (Rate Limits & Token Bucket)│
                                        └──────────────┬──────────────┘           └─────────────────────────────┘
                                                       │
                                                       ▼
                                        ┌─────────────────────────────┐
                                        │    AI Review Worker Pods    │
                                        │ (Gemini 3.7 / AWS Bedrock)  │
                                        └──────────────┬──────────────┘
                                                       │
                                      ┌────────────────┴────────────────┐
                                      │                                 │
                                      ▼                                 ▼
                       ┌─────────────────────────────┐   ┌─────────────────────────────┐
                       │  Aurora PostgreSQL Serverless│   │     Amazon S3 Bucket        │
                       │ (Row-Level Security Tenants)│   │ (Diff Caches & AST Graphs)  │
                       └─────────────────────────────┘   └─────────────────────────────┘
```

---

## 📦 Monorepo Package Topology

```text
apps/
├── api/             # Fastify 5 REST API Control Plane + OpenAPI Swagger (Port 3000)
├── web/             # Next.js 15 App Router Web App + /docs Hub + /admin CRM (Port 3001)
├── review-worker/   # BullMQ Asynchronous Queue Consumer for Gemini 3.7 AI Reviews
└── webhook-worker/  # BullMQ Consumer for GitHub & GitLab Ingestion with HMAC Validation

packages/
├── ai-reviewer/     # Google Gemini 3.7 Flash & AWS Bedrock AI Engine
├── ai-verifier/     # Anti-Hallucination Line Matcher & Verifier
├── auth/            # JWT Token Generation & RBAC Policy Middleware
├── cli/             # @codeguard/cli Developer Terminal Tool (Commander.js)
├── code-graph/      # Bidirectional AST Symbol Dependency Graph
├── code-parser/     # Babel & TypeScript AST Parsing Engine
├── core/            # Shared Data Contracts, TypeBox Schemas & Utilities
├── database/        # PostgreSQL Database Interfaces, Migrations & RLS
├── github/          # GitHub Webhook HMAC Verifier & Octokit REST Client
├── logger/          # Pino Structured JSON Logger with Correlation IDs
├── policy-engine/   # Branch Protection Gate & Entitlement Quota Evaluator
├── retrieval/       # In-Memory AST Symbol Index & Context Retrieval
└── security-scanner/# Shannon Entropy Secret Detector & AST Vulnerability Matcher
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: `v20.0.0+`
- **pnpm**: `v9.0.0+`
- **Docker**: (Optional for local PostgreSQL and Redis)

### 2. Installation & Dependency Setup

```bash
# Clone the repository
git clone https://github.com/akshaykumar33/aegisguard-ai.git
cd aegisguard-ai

# Install all workspace dependencies
pnpm install

# Setup environment variables
cp .env.example .env
```

### 3. Run Automated Test Suite

```bash
# Run unit & integration tests across all 15 packages (51/51 passing)
pnpm test
```

### 4. Start Local Development Services

```bash
# Terminal 1: Start Fastify API Control Plane (Port 3000)
pnpm --filter @codeguard/api dev

# Terminal 2: Start Next.js Web App & Documentation Hub (Port 3001)
pnpm --filter @codeguard/web dev
```

* **Web Portal & Dashboard**: [http://localhost:3001](http://localhost:3001)
* **Developer Documentation Hub**: [http://localhost:3001/docs](http://localhost:3001/docs)
* **Super Admin Multi-Tenant CRM**: [http://localhost:3001/admin](http://localhost:3001/admin)
* **Fastify Swagger OpenAPI**: [http://localhost:3000/docs](http://localhost:3000/docs)

---

## 💻 Developer CLI (`@codeguard/cli`)

Install and run AegisGuard directly in your local terminal or CI/CD pipelines:

```bash
# Run standalone via npx
npx @codeguard/cli scan --staged

# Or install globally
npm install -g @codeguard/cli
```

### Available CLI Commands

| Command | Description |
|---|---|
| `codeguard init` | Scaffolds `codeguard.config.json` and configures Git pre-commit hooks. |
| `codeguard scan [--staged] [--entropy]` | Runs deterministic local Shannon entropy and AST vulnerability scanner. |
| `codeguard review pr --number=<id>` | Triggers automated AI PR review simulation or cloud check. |
| `codeguard policy check` | Evaluates branch protection and approval rules. |
| `codeguard doctor` | Validates Node environment, Git configuration, and API health. |

---

## 🔒 Zero-Trust Security & Shannon Entropy

AegisGuard utilizes **Mathematical Shannon Entropy** ($H(X) = -\sum P(x) \log_2 P(x)$) to detect high-randomness string literals (API keys, RSA private keys, cloud tokens) with **0 network roundtrips**:

```typescript
import { calculateEntropy, scanSourceCode } from '@codeguard/security-scanner';

const result = scanSourceCode(sourceCode, {
  entropyThreshold: 4.200,
  blockOnEval: true,
});

if (result.isBlocked) {
  console.error('🚫 AegisGuard Security Gate: Blocked due to high entropy secret leak');
}
```

---

## ⚙️ Environment Variables Matrix

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `3000` | Fastify API listening port. |
| `DATABASE_URL` | Yes | `postgresql://...` | PostgreSQL / AWS Aurora connection string. |
| `REDIS_URL` | Yes | `redis://localhost:6379` | Redis connection for BullMQ and rate limits. |
| `GEMINI_API_KEY` | Yes | `""` | Google Gemini 3.7 Flash API key. |
| `GITHUB_APP_ID` | Yes | `""` | GitHub App numeric identifier. |
| `GITHUB_WEBHOOK_SECRET` | Yes | `""` | HMAC SHA-256 webhook signing secret. |
| `JWT_SECRET` | Yes | `""` | 32+ character key for cryptographic JWT auth. |
| `ENTROPY_CRITICAL_THRESHOLD` | No | `4.200` | Bits per character threshold for secret blocking. |

---

## 🗺️ Roadmap & Sequential Execution

The step-by-step engineering prompts to transition this platform into a fully managed AWS SaaS product are located in:
👉 [`prompts/sequential_execution_prompts.md`](./prompts/sequential_execution_prompts.md)

1. **Phase 1**: [AWS Cloud Infrastructure via Terraform](./prompts/execution/01_aws_cloud_infrastructure_terraform.md)
2. **Phase 2**: [Database Persistence & PostgreSQL RLS](./prompts/execution/02_database_persistence_aurora_postgresql.md)
3. **Phase 3**: [GitHub App & Webhook Security Hardening](./prompts/execution/03_github_app_and_webhook_security.md)
4. **Phase 4**: [CLI Distribution & npm Provenance](./prompts/execution/04_cli_distribution_and_npm_provenance.md)
5. **Phase 5**: [Multi-Model AI Gateway (Gemini + Bedrock)](./prompts/execution/05_multi_model_ai_gateway_bedrock_gemini.md)
6. **Phase 6**: [Enterprise SSO & Signed Audit Governance](./prompts/execution/06_enterprise_sso_and_audit_governance.md)

---

## 📄 License

Distributed under the **Apache 2.0 License**. See [`LICENSE`](./LICENSE) for more information.
