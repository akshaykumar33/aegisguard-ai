# PHASE 1 PROMPT: AWS Cloud Infrastructure via Terraform (Option B Balanced SaaS)

## ROLE
Act as a **Staff DevSecOps Architect & AWS Cloud Infrastructure Engineer**.

## CONTEXT
You are implementing the production AWS infrastructure for **CodeGuard AI** based on the architectural decisions in `architecture_audit_report.md`.

## TARGET ENVIRONMENT & SERVICES
- **AWS ECS on AWS Fargate**: Container tasks for `apps/api` (port 3000), `apps/web` (port 3001), `apps/webhook-worker`, and `apps/review-worker`.
- **Amazon Aurora PostgreSQL Serverless v2**: Multi-AZ with Min 0.5 ACU, Max 8 ACU, and automated PITR (Point-In-Time-Recovery).
- **Amazon ElastiCache Redis 7.0**: Multi-AZ replication group with encryption in-transit and at-rest.
- **Amazon SQS Queues**: `codeguard-webhooks-queue` and `codeguard-reviews-queue` with Dead-Letter Queues (DLQs) configured with 5 max receives.
- **Amazon S3**: Versioned, server-side AES-256 encrypted bucket `codeguard-ast-diffs-prod` with 90-day lifecycle expiration.
- **AWS ALB & AWS WAF v2**: SSL termination, path-based routing (`/api/*` -> API service, `/*` -> Next.js web app), and rate-limiting rules.
- **AWS Secrets Manager & KMS**: Customer-managed KMS keys for database and secret encryption.

## INSTRUCTIONS
1. Create a modular Terraform directory structure in `infrastructure/terraform/`:
   ```text
   infrastructure/terraform/
   ├── modules/
   │   ├── vpc/
   │   ├── ecs_fargate/
   │   ├── aurora_postgresql/
   │   ├── elasticache_redis/
   │   ├── sqs/
   │   └── alb_waf/
   └── environments/
       ├── dev/
       └── prod/
   ```
2. Write clean, parameterized Terraform modules with strict input validation and zero hardcoded credentials.
3. Configure ECS Task Definitions with CloudWatch log drivers, IAM execution roles adhering to least-privilege, and health check endpoints (`/api/v1/health` and `/health`).
4. Output all generated resource ARNs, database connection endpoints, and load balancer DNS names.

## ACCEPTANCE CRITERIA
- `terraform validate` and `terraform fmt -check` pass with zero warnings.
- All database credentials and third-party API tokens are sourced exclusively from AWS Secrets Manager.
- No public IP addresses assigned to database or backend worker subnets.
