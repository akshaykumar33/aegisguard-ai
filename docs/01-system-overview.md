# CodeGuard: Enterprise AI Code Governance & Git Protection Platform

## System Overview

CodeGuard is an enterprise-grade, multi-tenant AI code governance, automated review, and server-side Git workflow protection platform. It is engineered to safeguard software engineering organizations against direct pushes, unverified AI agent contributions, secret leaks, security vulnerabilities, and architectural drift.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DEVELOPER & AI AGENT ECOSYSTEM                                │
│   [Git CLI]    [VS Code / Cursor]    [Claude Code / Codex]    [JetBrains IDE]    [GitHub Desktop]│
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                  │
                                                  ▼ Local Hooks & Policy Enforcement (Advisory)
                                      ┌───────────────────────┐
                                      │  CodeGuard CLI & Hook  │
                                      └───────────────────────┘
                                                  │
                                                  ▼ Pull Request / Webhook Event
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              CODEGUARD SERVER-SIDE CONTROL PLANE                                │
│                                                                                                 │
│  ┌───────────────────────┐    ┌────────────────────────┐    ┌────────────────────────────────┐  │
│  │   Webhook Ingestion   │───▶│   Redis / BullMQ Queue │───▶│      Review Pipeline Worker    │  │
│  │   (HMAC Verification) │    │   (Distributed Tasks)  │    │  - Deterministic SAST & Secrets│  │
│  └───────────────────────┘    └────────────────────────┘    │  - AST & Code Graph Analysis   │  │
│                                                             │  - Grounded AI Review & Fixes  │  │
│  ┌───────────────────────┐    ┌────────────────────────┐    │  - Hallucination Verification  │  │
│  │  Policy Engine Gate   │◀───│  Drift Remediator Job  │    └────────────────────────────────┘  │
│  │  - CODEOWNERS Gate    │    │  (GitHub/GitLab Guard) │                    │                   │
│  │  - 2-Person Human Appr│    └────────────────────────┘                    ▼                   │
│  └───────────────────────┘                 │                 ┌───────────────────────────────┐  │
│              │                             ▼                 │ GitHub / GitLab Status Check  │  │
│              └──────────────────────────────────────────────▶│ & Sticky PR Review Comments   │  │
│                                                              └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Mission & Value Proposition

1. **Zero-Trust Branch Protection**: No developer, AI agent (Claude Code, Cursor, Codex), or script can ever push directly to protected branches (`main`, `master`, `production`, `release/*`). Server-side branch protection is authoritative and self-healing against configuration drift.
2. **Deterministic & Grounded Security**: Deterministic secret detection with Shannon entropy scanning catches credentials in any form (AWS, GitHub, GitLab, private keys, database URLs, AI API keys, generic tokens) before LLMs process code.
3. **Multi-Stage AI Code Review**: CodeRabbit-grade reviews featuring AST-aware symbol call graphs, 1-click drop-in GitHub code suggestions, and anti-hallucination verification.
4. **Strict Separation of Review Authority**: AI reviews **never** substitute for human peer approval. Merging requires explicit, signed human peer approvals and CODEOWNERS satisfaction.
5. **Emergency Break-Glass Protocol**: Fully audited, time-bounded override mechanisms for critical production incident remediation.
