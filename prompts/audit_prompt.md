# Full Codebase + Architecture + AWS Infrastructure + Developer Platform Audit

## ROLE

Act as a **Principal Software Architect, Staff Backend Engineer, DevSecOps Architect, Cloud Architect, Security Engineer, Developer Experience Engineer, and SaaS Platform Architect**.

I am building an enterprise-grade **AI Code Governance / Code Intelligence / PR Review platform**.

The product will eventually provide:

### Basic / Student

* Local CLI
* Local codebase analysis
* Code context
* Code graph
* RAG/context retrieval
* Local code review
* Secret detection
* Branch/commit governance

### Pro

* Everything in Basic
* GitHub/GitLab integration
* PR review
* AI code review
* Security scanning
* Branch protection
* Human approval enforcement
* Repository governance

### Organization / Enterprise

* Everything in Pro
* Multiple users
* Multiple repositories
* Organization policies
* Central administration
* Repository governance
* Usage limits
* PR limits
* AI review limits
* Code indexing limits
* Audit logs
* Analytics
* Team management
* Centralized billing
* Organization-wide security policies

The goal of this task is **NOT to immediately start coding**.

First perform a complete audit of the existing codebase and determine the correct production architecture.

---

# 1. PRIMARY OBJECTIVE

Audit the entire existing repository and answer:

> **"If this codebase had to become a production-grade AWS-hosted enterprise SaaS platform with a distributed CLI/npm ecosystem, AI code intelligence, GitHub/GitLab integrations, PR governance, code indexing, RAG, graph-based context, billing, multi-tenancy, and enterprise security — what needs to change?"**

Do not assume that the current architecture is correct.

Do not preserve existing infrastructure merely because it already exists.

Do not judge architecture based on:

* Existing Docker files
* Existing Terraform
* Existing Kubernetes manifests
* Existing GitHub Actions
* Existing YAML
* Existing README claims
* Existing deployment assumptions

Evaluate the **actual implementation and system behavior** first.

---

# 2. AUDIT PRINCIPLE

Follow this rule:

```text
Existing Code
      ↓
Actual Behavior
      ↓
Architecture Assessment
      ↓
Business Requirements
      ↓
Security Requirements
      ↓
Scale Requirements
      ↓
AWS Architecture
      ↓
Recommended Changes
```

Do NOT do:

```text
Existing Terraform
      ↓
Assume architecture is correct
      ↓
Build more Terraform
```

---

# 3. FIRST: INVENTORY THE CODEBASE

Scan the entire repository.

Identify:

```text
Applications
Packages
Services
Libraries
CLI
Frontend
Backend
Workers
Database
Queues
AI modules
Authentication
Authorization
Integrations
Infrastructure
Deployment
Testing
Documentation
Scripts
Configuration
Environment variables
Build system
Package management
```

Produce a complete architecture inventory.

---

# 4. DETECT ACTUAL TECHNOLOGY STACK

Identify what is actually being used.

For example:

```text
Frontend
Backend
Node.js
TypeScript
React
Next.js
Express
NestJS
PostgreSQL
MongoDB
Redis
Kafka
BullMQ
Docker
Terraform
GitHub Actions
AWS
etc.
```

Do not infer from package names alone.

Trace actual usage.

Identify:

* unused dependencies
* duplicate libraries
* dead code
* abandoned modules
* experimental code
* production code
* prototype code

---

# 5. CODEBASE PROFESSIONALISM AUDIT

Evaluate:

## Architecture

Check:

* Separation of concerns
* Modularity
* Domain boundaries
* Dependency direction
* Coupling
* Cohesion
* Circular dependencies
* Shared utilities
* Global state
* Business logic placement

## Code Quality

Check:

* Naming
* Type safety
* Error handling
* Validation
* Async handling
* Logging
* Exception handling
* Code duplication
* Complexity
* Maintainability

## Engineering Quality

Check:

* SOLID principles
* DRY
* KISS
* YAGNI
* Dependency inversion
* Testability
* Configuration management

Give each category a score:

```text
0 = Critical
1 = Poor
2 = Needs improvement
3 = Acceptable
4 = Good
5 = Production grade
```

---

# 6. ARCHITECTURAL SMELL DETECTION

Identify:

* God classes
* God services
* Giant controllers
* Giant components
* Circular dependencies
* Database logic inside controllers
* Business logic inside UI
* Infrastructure logic inside business modules
* Hard-coded configuration
* Hard-coded plans
* Hard-coded limits
* Hard-coded roles
* Hard-coded repositories
* Hard-coded Git providers
* Vendor lock-in
* Hidden global state

For every major smell explain:

```text
Problem
Why it matters
Risk
Recommended architecture
Priority
```

---

# 7. DOMAIN ARCHITECTURE

Determine whether the codebase should be structured around domains such as:

```text
Identity
Organizations
Customers
Repositories
Git Providers
Policies
Branches
Pull Requests
Code Intelligence
Code Indexing
Code Graph
RAG
AI Review
Security
Secrets
Notifications
Billing
Subscriptions
Usage
Audit
Analytics
```

Determine which should be:

* Same service
* Separate module
* Separate worker
* Separate service

Do not introduce microservices just for the sake of microservices.

Prefer a **modular monolith initially** where appropriate.

Extract services only when there is a concrete reason.

---

# 8. TARGET PRODUCT ARCHITECTURE

The target architecture should support:

```text
Developer
   ↓
CLI
   ↓
Local Codebase
   ↓
Local Analysis
   ↓
Local Context
   ↓
Optional Cloud Sync
```

and:

```text
Developer
   ↓
Feature Branch
   ↓
GitHub/GitLab
   ↓
Pull Request
   ↓
Webhook
   ↓
Governance Platform
   ↓
Code Context
   ↓
Security Scanning
   ↓
AI Review
   ↓
Policy Engine
   ↓
Human Approval
   ↓
Merge
```

and:

```text
Organization
   ↓
Admin Platform
   ↓
Users
Repositories
Policies
Plans
Usage
Billing
Audit
```

---

# 9. BASIC / STUDENT ARCHITECTURE

The Basic plan should primarily operate locally.

Expected architecture:

```text
User
 ↓
npm package / CLI
 ↓
Local repository
 ↓
Local scanner
 ↓
Local AST analysis
 ↓
Local code graph
 ↓
Local context/RAG
 ↓
Local review
```

Determine:

* What should run locally?
* What should be downloaded?
* What should be cached?
* What requires cloud connectivity?
* What can work offline?
* What data should never leave the machine?

Provide a privacy/security recommendation.

---

# 10. PRO ARCHITECTURE

Pro should add:

```text
CLI
 ↓
Git Provider
 ↓
Repository
 ↓
Webhook
 ↓
Cloud Review Pipeline
 ↓
AI Review
 ↓
Security
 ↓
Policy
 ↓
PR status
```

Determine the correct AWS architecture for this.

---

# 11. ORGANIZATION ARCHITECTURE

Organization should support:

```text
Organization
 ├── Users
 ├── Teams
 ├── Roles
 ├── Repositories
 ├── Policies
 ├── PRs
 ├── Reviews
 ├── Usage
 ├── Billing
 └── Audit
```

Evaluate multi-tenancy strategy.

Compare:

```text
Shared database
Shared schema
Tenant schema
Tenant database
Hybrid
```

Recommend the correct approach for:

* Basic
* Pro
* Organization
* Enterprise

Consider:

* Isolation
* Cost
* Operational complexity
* Scaling
* Security
* Backup
* Disaster recovery

---

# 12. AWS ARCHITECTURE

I intend to use AWS.

Do not assume EC2 is automatically the answer.

Evaluate:

```text
ECS
EKS
Lambda
Fargate
EC2
SQS
SNS
EventBridge
Step Functions
RDS PostgreSQL
Aurora PostgreSQL
ElastiCache Redis
S3
CloudFront
API Gateway
ALB
OpenSearch
Bedrock
Secrets Manager
KMS
CloudWatch
WAF
Cognito / external identity provider
ECR
```

Choose services based on actual workload.

For each selected service explain:

```text
Why
Expected workload
Cost implications
Scaling
Operational complexity
Failure modes
Alternative
```

---

# 13. RECOMMENDED INITIAL AWS ARCHITECTURE

Determine whether an architecture similar to this makes sense:

```text
                    CloudFront
                       │
                       ▼
                 Web Application
                       │
                       ▼
                    ALB/API
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       API App      Worker App   Webhook App
          │            │            │
          └──────┬─────┴──────┬─────┘
                 │            │
                 ▼            ▼
             PostgreSQL     Redis
                 │
        ┌────────┼────────┐
        │        │        │
        ▼        ▼        ▼
       S3     Vector     Search
              Store
                 │
                 ▼
             Code Graph
                 │
                 ▼
              AI Layer
```

Do not blindly implement this diagram.

Validate or replace it.

---

# 14. LOCAL CLI ARCHITECTURE

Design the CLI as a proper product.

Example:

```text
@company/code
```

Commands:

```bash
code init
code login
code status
code scan
code review
code check
code branch
code commit
code doctor
code update
```

Determine:

* CLI framework
* TypeScript architecture
* Binary packaging
* OS support
* Authentication
* Configuration
* Cache
* Local database
* Local vector store
* Local graph store
* Update mechanism
* Telemetry
* Offline support

---

# 15. NPM PACKAGE STRATEGY

Determine whether to use:

```text
npm package
npm CLI
npx
Homebrew
Standalone binary
Docker
VS Code extension
JetBrains plugin
```

Recommend the correct distribution strategy.

Possible structure:

```text
@company/cli
@company/core
@company/scanner
@company/policy
@company/code-intelligence
@company/config
```

Do not create unnecessary packages.

Explain package boundaries.

---

# 16. NPM REGISTRY

Evaluate:

### Public npm

For:

* CLI
* Developer tooling
* Open SDKs

### Private registry

For:

* Internal organization packages
* Enterprise integrations
* Private plugins

Determine whether AWS CodeArtifact is useful.

Compare:

```text
npmjs
GitHub Packages
AWS CodeArtifact
```

Provide recommendation.

---

# 17. CLI SECURITY

Never put:

```text
AWS access keys
GitHub organization admin tokens
LLM provider master keys
Database credentials
```

inside the CLI.

Use:

```text
Short-lived credentials
OAuth/device flow
OIDC where appropriate
Scoped tokens
```

CLI should authenticate to our platform rather than directly receiving infrastructure credentials.

---

# 18. LOCAL CODE INTELLIGENCE

Audit current code intelligence implementation.

Determine whether the platform should use:

```text
AST
Tree-sitter
Language Server Protocol
Symbol extraction
Dependency graph
Embeddings
Vector search
Keyword search
Graph traversal
```

Design:

```text
Repository
 ↓
Parser
 ↓
AST
 ↓
Symbols
 ↓
Dependency Graph
 ↓
Chunks
 ↓
Embeddings
 ↓
Vector Store
```

---

# 19. RAG ARCHITECTURE

Evaluate current RAG implementation.

It should not simply be:

```text
all files → embeddings → LLM
```

Design retrieval around:

```text
PR Diff
 ↓
Changed symbols
 ↓
Dependency graph
 ↓
Relevant files
 ↓
Semantic retrieval
 ↓
Historical context
 ↓
Policy context
 ↓
LLM
```

Evaluate:

* Chunking
* Embedding model
* Retrieval
* Re-ranking
* Context limits
* Caching
* Freshness
* Incremental updates

---

# 20. CODE GRAPH

Audit whether a graph database is actually required.

Compare:

```text
PostgreSQL
PostgreSQL + graph tables
Neo4j
Neptune
Other graph systems
```

Do not introduce a graph database unless justified by scale/query requirements.

---

# 21. AI ARCHITECTURE

Separate:

```text
AI Provider
```

from:

```text
Review Engine
```

Architecture:

```text
Review Engine
     │
     ▼
AI Gateway
     │
 ┌───┼─────────┐
 │   │         │
 ▼   ▼         ▼
AWS Bedrock
OpenAI
Other Provider
```

Allow model/provider replacement.

---

# 22. AI COST CONTROL

Analyze:

* Token usage
* PR size
* Repository size
* Embedding cost
* Review frequency
* Concurrent PRs
* Model selection

Design:

```text
Small PR → cheaper model
Large PR → stronger model
Security issue → specialized analysis
Enterprise → configurable model policy
```

Implement caching where useful.

---

# 23. RATE LIMITING

This is mandatory.

Rate limits should be configurable by plan.

Example:

```text
Basic

Users: 1
Repositories: 3
PRs: 0
AI Reviews: 100/month
Code Index: 5 GB
```

```text
Pro

Users: 1
Repositories: 10
PRs: 100/month
AI Reviews: 500/month
Code Index: 50 GB
```

```text
Organization

Users: 100
Repositories: 100
PRs: 2,000/month
AI Reviews: configurable
Code Index: 500 GB
```

Do not hard-code these numbers.

Create an entitlement/usage system.

---

# 24. USAGE METERING

Track:

```text
Users
Repositories
PRs
AI Reviews
Tokens
Embeddings
Storage
Code Index Size
API Calls
Concurrent Jobs
Review Runtime
```

Architecture:

```text
Request
 ↓
Usage Check
 ↓
Entitlement
 ↓
Rate Limit
 ↓
Process
 ↓
Usage Event
 ↓
Usage Ledger
```

---

# 25. QUEUE ARCHITECTURE

Heavy workloads must be asynchronous.

Examples:

```text
Repository indexing
Code graph construction
Embedding
PR review
Security scanning
Large repository scanning
Email
Notifications
```

Evaluate:

```text
SQS
SNS
EventBridge
BullMQ/Redis
Kafka
```

Choose the simplest system that satisfies requirements.

---

# 26. WORKER ARCHITECTURE

Separate workloads:

```text
API
Webhook Worker
Repository Index Worker
Embedding Worker
AI Review Worker
Security Scanner Worker
Notification Worker
Billing Worker
```

Do not run expensive AI processing inside API requests.

---

# 27. GITHUB/GITLAB INTEGRATION

Create provider abstraction:

```text
GitProvider
```

Support:

```text
GitHub
GitLab
Bitbucket
```

Operations:

```text
Repositories
Branches
Pull Requests
Reviews
Comments
Checks
Branch Protection
Webhooks
CODEOWNERS
```

Use least-privilege OAuth/app permissions.

---

# 28. WEBHOOK SECURITY

Audit:

* Signature verification
* Replay prevention
* Idempotency
* Event ordering
* Retry handling
* Dead-letter queues

Every webhook should be treated as untrusted input.

---

# 29. BRANCH GOVERNANCE

Organization should define:

```text
Protected branches
Branch patterns
Required PR
Required approvals
Required checks
CODEOWNERS
Force push restrictions
Delete restrictions
```

The Git provider remains the final enforcement layer.

---

# 30. HUMAN REVIEW

The architecture must guarantee:

```text
AI Review ≠ Human Approval
```

A PR should merge only when:

```text
Security PASS
+
CI PASS
+
AI Review PASS
+
Required Human Approval
+
Policy PASS
```

---

# 31. BILLING

Design subscription architecture around:

```text
Customer
Plan
Subscription
Entitlements
Usage
Invoices
Payments
```

Support:

```text
Basic
Pro
Organization
Enterprise
```

Do not hard-code plans.

---

# 32. SECURITY AUDIT

Perform a serious security review.

Check:

```text
Authentication
Authorization
Tenant isolation
Secrets
API security
CLI authentication
Token storage
Git provider credentials
Webhook validation
AI prompt injection
Repository data isolation
Code execution
File uploads
SSRF
RCE
Command injection
SQL injection
XSS
CSRF
IDOR
Privilege escalation
Rate limiting
Abuse prevention
```

---

# 33. MALICIOUS REPOSITORY CONTENT

Assume repositories may contain malicious code and instructions.

The system must safely handle:

```text
README prompt injection
Malicious scripts
Malicious package.json
Postinstall scripts
Forks
Untrusted PRs
Binary files
Huge files
Zip bombs
Symlinks
Path traversal
Secrets
```

Never blindly execute repository code during indexing.

Sandbox untrusted execution.

---

# 34. AI SANDBOX

If repository code must be executed:

Use isolated execution.

Consider:

```text
Firecracker
AWS Lambda isolation
ECS task isolation
Dedicated sandbox workers
```

Never execute arbitrary repository code directly inside the main API container.

---

# 35. OBSERVABILITY

Implement:

```text
Logs
Metrics
Traces
Error tracking
Queue metrics
AI metrics
Token metrics
Review latency
Git provider failures
Webhook failures
Database metrics
```

Define useful SLOs.

Example:

```text
PR review completion < X minutes
Webhook processing < X seconds
API availability > X%
```

Choose realistic targets after measuring.

---

# 36. DISASTER RECOVERY

Design:

```text
Database backup
Point-in-time recovery
S3 versioning
Repository index rebuild
Queue recovery
Webhook replay
Configuration backup
Secrets recovery
```

Define:

```text
RPO
RTO
```

for each critical component.

---

# 37. INFRASTRUCTURE AS CODE

After architecture is approved, design AWS infrastructure.

Use Terraform or another IaC tool if justified.

Separate:

```text
dev
staging
production
```

Use reusable modules.

Do not duplicate huge infrastructure files.

---

# 38. CI/CD

Design pipeline:

```text
Pull Request
 ↓
Lint
 ↓
Type Check
 ↓
Unit Tests
 ↓
Integration Tests
 ↓
Security Scan
 ↓
Build
 ↓
Container Scan
 ↓
Deploy Staging
 ↓
Smoke Tests
 ↓
Production Approval
 ↓
Production
```

Use immutable deployments.

---

# 39. CONTAINERIZATION

Determine which components actually require containers.

Possible:

```text
API
Workers
Indexers
AI Workers
Security Scanners
```

Do not containerize everything unnecessarily.

Recommend:

```text
ECS/Fargate
```

or another AWS solution based on actual workload.

---

# 40. DATABASE AUDIT

Inspect:

* Schema
* Indexes
* Queries
* Transactions
* Connection management
* Migrations
* N+1 queries
* Locks
* JSONB usage
* Data ownership
* Tenant isolation
* Backup strategy

Identify expensive queries.

---

# 41. REDIS AUDIT

If Redis exists, determine exactly why.

Separate:

```text
Cache
Session
Rate Limiting
Queue
Distributed Lock
Pub/Sub
```

Do not use Redis as an accidental permanent database.

---

# 42. PERFORMANCE AUDIT

Measure:

```text
API latency
DB latency
Memory
CPU
Bundle size
CLI startup
Repository indexing
Embedding
AI review
Webhook processing
```

Identify bottlenecks.

---

# 43. COST AUDIT

Estimate AWS cost for:

```text
10 users
100 users
1,000 users
10,000 users
100 organizations
1,000 organizations
```

Include:

```text
Compute
Database
Storage
Bandwidth
Queues
Redis
Search
AI
Embeddings
Logging
Monitoring
```

Provide:

```text
Low
Expected
High
```

cost scenarios.

Do not invent precise AWS pricing without validating current pricing.

---

# 44. ARCHITECTURE OPTIONS

Provide at least three architectures:

### Option A — Cost Optimized

For early startup/MVP.

### Option B — Balanced

For production SaaS.

### Option C — Enterprise Scale

For large organizations.

Compare:

```text
Cost
Complexity
Scalability
Security
Operational burden
Migration path
```

Recommend one.

---

# 45. WHAT TO KEEP / CHANGE / REMOVE

Produce a table:

```text
Component
Current
Decision
Reason
Priority
```

Possible decisions:

```text
KEEP
REFACTOR
REPLACE
REMOVE
INTRODUCE
DEFER
```

Example:

```text
Current Redis usage
→ REFACTOR

Current Kafka
→ REMOVE initially

Current Terraform
→ REWRITE

Current authentication
→ KEEP + HARDEN
```

Only make these decisions after inspecting the code.

---

# 46. TECHNICAL DEBT

Create a technical debt register.

For each item:

```text
Problem
Impact
Severity
Effort
Priority
Recommended Fix
```

Classify:

```text
P0 Critical
P1 High
P2 Medium
P3 Low
```

---

# 47. PRODUCTION READINESS SCORE

Score:

```text
Architecture
Code Quality
Security
Testing
Database
Performance
AWS Readiness
DevOps
Observability
Documentation
Developer Experience
AI Architecture
Multi-tenancy
Billing
```

Provide:

```text
Current Score
Target Score
Gap
```

---

# 48. FINAL TARGET REPOSITORY STRUCTURE

After auditing, propose the ideal repository structure.

For example:

```text
apps/
  api/
  admin/
  developer-portal/
  worker/

packages/
  cli/
  core/
  policy-engine/
  code-intelligence/
  git-providers/
  ai/
  security/
  database/
  shared/

infrastructure/
  terraform/

docs/

tests/
```

Do not force this exact structure if another structure is better.

---

# 49. NPM RELEASE PIPELINE

Design:

```text
Developer
 ↓
Changes CLI
 ↓
Tests
 ↓
Build
 ↓
Security Scan
 ↓
Version
 ↓
Publish
 ↓
npm registry
 ↓
Users
 ↓
CLI update
```

Use:

* semantic versioning
* changelog
* release automation
* package provenance/signing where supported
* dependency scanning
* npm provenance where appropriate

---

# 50. CLI UPDATE SYSTEM

The CLI should be safely updatable.

Design:

```text
code update
```

or automatic update notifications.

Never automatically install an untrusted binary.

Validate package provenance/signatures where supported.

---

# 51. DOCUMENTATION DELIVERABLE

Create:

```text
/docs

architecture/
  system.md
  aws.md
  cli.md
  code-intelligence.md
  ai-review.md

security/
  threat-model.md
  security-architecture.md
  secrets.md

database/
  schema.md
  tenancy.md

devops/
  ci-cd.md
  infrastructure.md
  deployment.md

developer/
  cli.md
  local-development.md

operations/
  monitoring.md
  incident-response.md
  disaster-recovery.md

product/
  plans.md
  entitlements.md
  usage.md
```

---

# 52. AUDIT REPORT FORMAT

The first output must be an **AUDIT REPORT**, not implementation.

Structure:

```text
1. Executive Summary

2. Current Architecture

3. Current Technology Stack

4. Repository Structure

5. Domain Architecture

6. Code Quality

7. Security

8. Database

9. API Architecture

10. AI Architecture

11. Code Intelligence

12. RAG

13. Code Graph

14. Git Provider Integration

15. CLI

16. NPM Packaging

17. Infrastructure

18. AWS Readiness

19. DevOps

20. Testing

21. Observability

22. Performance

23. Scalability

24. Multi-Tenancy

25. Billing

26. Rate Limiting

27. Technical Debt

28. What to Keep

29. What to Refactor

30. What to Remove

31. What to Introduce

32. Recommended AWS Architecture

33. Recommended Repository Architecture

34. Migration Plan

35. Cost Analysis

36. Security Threat Model

37. Production Readiness Score
```

---

# 53. MIGRATION PLAN

After the audit, produce a phased implementation plan.

Example:

```text
Phase 0
Audit

Phase 1
Architecture cleanup

Phase 2
Core domain restructuring

Phase 3
Database stabilization

Phase 4
Authentication + tenancy

Phase 5
CLI + npm

Phase 6
Local code intelligence

Phase 7
AWS foundation

Phase 8
Git provider integration

Phase 9
PR review pipeline

Phase 10
Security scanning

Phase 11
AI review

Phase 12
Organization features

Phase 13
Billing + usage

Phase 14
Observability

Phase 15
Production hardening
```

For every phase provide:

```text
Goals
Tasks
Dependencies
Risk
Estimated complexity
Acceptance criteria
```

---

# 54. IMPLEMENTATION RULE

DO NOT immediately rewrite the entire codebase.

First:

```text
AUDIT
 ↓
ARCHITECTURE DECISION
 ↓
PRIORITIZATION
 ↓
MIGRATION PLAN
 ↓
IMPLEMENTATION
 ↓
TESTING
 ↓
SECURITY VALIDATION
```

If the current architecture is already good, preserve it.

If it is poor, refactor incrementally.

Avoid unnecessary rewrites.

---

# 55. FINAL DECISION

At the end answer these questions explicitly:

### Architecture

1. Should this remain a modular monolith?
2. Which workloads should become workers?
3. Which workloads should become separate services?
4. Is Kafka necessary?
5. Is Kubernetes necessary?
6. Is Redis necessary?
7. Which database architecture should be used?

### AWS

8. ECS vs EKS vs Lambda?
9. RDS vs Aurora?
10. SQS vs Kafka?
11. ElastiCache?
12. S3?
13. OpenSearch?
14. Bedrock?
15. CloudFront?
16. WAF?
17. Secrets Manager?
18. KMS?

### AI

19. Which model architecture?
20. Which embedding strategy?
21. Which vector store?
22. Do we actually need a graph database?
23. How should RAG work?
24. How do we control AI cost?

### Developer Platform

25. npm package structure?
26. CLI architecture?
27. VS Code extension?
28. JetBrains plugin?
29. Local vs cloud processing?

### Git Governance

30. GitHub App or OAuth?
31. GitLab integration?
32. Branch protection?
33. Webhooks?
34. PR review pipeline?
35. Human approval?

### Business

36. Basic entitlement model?
37. Pro entitlement model?
38. Organization model?
39. Usage metering?
40. Rate limiting?
41. Billing?

---

# 56. GOLDEN RULE

Do not optimize the architecture for what the codebase currently is.

Optimize it for what the product actually needs to become.

The final recommendation should be:

```text
Current Codebase
      ↓
Honest Audit
      ↓
Remove unnecessary complexity
      ↓
Fix architectural weaknesses
      ↓
Build clean domain boundaries
      ↓
AWS foundation
      ↓
CLI/npm distribution
      ↓
Local code intelligence
      ↓
Git provider integration
      ↓
PR governance
      ↓
AI review
      ↓
Organization platform
      ↓
Usage + billing
      ↓
Enterprise security
```

The most important requirement is:

> **Do not blindly follow the existing infrastructure. Audit the actual code, identify what is genuinely valuable, remove accidental complexity, and then design the simplest AWS architecture that can safely evolve from a local CLI product into a Pro Git-integrated product and eventually an enterprise organization-wide code governance platform.**

after everything make a proper sequential prompts and push as privately for my github