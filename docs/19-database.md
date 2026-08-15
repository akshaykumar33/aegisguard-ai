# Database Architecture & Entity Relationships

## PostgreSQL & Drizzle ORM Schema

CodeGuard stores multi-tenant governance data in PostgreSQL.

### Core Schema Tables
- `organizations`: Multi-tenant organization records
- `repositories`: Connected GitHub/GitLab repositories
- `pull_requests`: PR tracking, base/head branches, author attribution
- `review_runs`: Individual execution runs of the review pipeline
- `findings`: Granular findings with fingerprints, severity, and category
- `policies`: Central policy rules and inheritance hierarchy
- `branch_policies`: Server-side branch protection rules
- `policy_violations`: Audit log of policy breaches
- `policy_drift_logs`: History of provider branch protection drifts
- `emergency_overrides`: Time-bounded break-glass authorizations
- `audit_logs`: Immutable security audit events
