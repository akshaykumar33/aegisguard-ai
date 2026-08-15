CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"key_prefix" varchar(16) NOT NULL,
	"hashed_key" text NOT NULL,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'MEMBER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"avatar_url" text,
	"password_hash" text,
	"is_platform_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" varchar(50) DEFAULT 'github' NOT NULL,
	"provider_repo_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"private" boolean DEFAULT true NOT NULL,
	"default_branch" varchar(100) DEFAULT 'main' NOT NULL,
	"clone_url" text NOT NULL,
	"installation_id" varchar(255) NOT NULL,
	"last_indexed_commit_sha" varchar(64),
	"last_indexed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_commits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"sha" varchar(64) NOT NULL,
	"message" text NOT NULL,
	"author_name" varchar(255),
	"author_email" varchar(255),
	"authored_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"commit_sha" varchar(64) NOT NULL,
	"path" text NOT NULL,
	"language" varchar(50),
	"size_bytes" varchar(50),
	"content_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_installations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"provider" varchar(50) DEFAULT 'github' NOT NULL,
	"installation_id" varchar(255) NOT NULL,
	"account_name" varchar(255) NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"suspended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repository_installations_installation_id_unique" UNIQUE("installation_id")
);
--> statement-breakpoint
CREATE TABLE "repository_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"commit_sha" varchar(64) NOT NULL,
	"s3_key" text NOT NULL,
	"file_count" varchar(50),
	"symbol_count" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"http_method" varchar(10) NOT NULL,
	"route_path" text NOT NULL,
	"handler_symbol_id" uuid,
	"auth_required" varchar(10) DEFAULT 'true',
	"file_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "code_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"commit_sha" varchar(64) NOT NULL,
	"file_path" text NOT NULL,
	"symbol_id" uuid,
	"start_line" integer NOT NULL,
	"end_line" integer NOT NULL,
	"content" text NOT NULL,
	"language" varchar(50) NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "code_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chunk_id" uuid NOT NULL,
	"model" varchar(100) DEFAULT 'text-embedding-3-small' NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "code_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"source_symbol_id" uuid NOT NULL,
	"target_symbol_id" uuid NOT NULL,
	"relation_type" varchar(50) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "code_symbols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"commit_sha" varchar(64) NOT NULL,
	"file_path" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"kind" varchar(50) NOT NULL,
	"start_line" integer NOT NULL,
	"end_line" integer NOT NULL,
	"start_column" integer,
	"end_column" integer,
	"signature" text,
	"docstring" text,
	"content_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"version" varchar(100) NOT NULL,
	"package_manager" varchar(50) NOT NULL,
	"is_dev" varchar(10) DEFAULT 'false',
	"manifest_file_path" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pull_request_commits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pull_request_id" uuid NOT NULL,
	"sha" varchar(64) NOT NULL,
	"message" text NOT NULL,
	"author_username" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pull_request_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pull_request_id" uuid NOT NULL,
	"file_path" text NOT NULL,
	"old_file_path" text,
	"status" varchar(20) NOT NULL,
	"additions" integer DEFAULT 0 NOT NULL,
	"deletions" integer DEFAULT 0 NOT NULL,
	"patch" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pull_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"state" varchar(20) DEFAULT 'OPEN' NOT NULL,
	"source_branch" varchar(255) NOT NULL,
	"target_branch" varchar(255) NOT NULL,
	"head_sha" varchar(64) NOT NULL,
	"base_sha" varchar(64) NOT NULL,
	"author_username" varchar(255) NOT NULL,
	"is_draft" boolean DEFAULT false NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"merged_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"pull_request_id" uuid NOT NULL,
	"commit_sha" varchar(64) NOT NULL,
	"state" varchar(50) DEFAULT 'QUEUED' NOT NULL,
	"policy_outcome" varchar(50),
	"summary" text,
	"critical_count" integer DEFAULT 0 NOT NULL,
	"high_count" integer DEFAULT 0 NOT NULL,
	"medium_count" integer DEFAULT 0 NOT NULL,
	"low_count" integer DEFAULT 0 NOT NULL,
	"info_count" integer DEFAULT 0 NOT NULL,
	"duration_ms" integer,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_run_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"error" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dependency_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"finding_id" uuid NOT NULL,
	"package_name" varchar(255) NOT NULL,
	"current_version" varchar(100) NOT NULL,
	"vulnerable_version_range" varchar(255) NOT NULL,
	"cve_id" varchar(100),
	"fixed_version" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"pull_request_id" uuid,
	"review_run_id" uuid,
	"fingerprint" varchar(64) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"source" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"file_path" text NOT NULL,
	"start_line" integer NOT NULL,
	"end_line" integer NOT NULL,
	"evidence" text,
	"impact" text,
	"recommendation" text,
	"rule_id" varchar(100),
	"policy_id" uuid,
	"confidence" double precision DEFAULT 1 NOT NULL,
	"blocking" boolean DEFAULT false NOT NULL,
	"status" varchar(30) DEFAULT 'OPEN' NOT NULL,
	"dismissed_reason" text,
	"dismissed_by_user_id" uuid,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "secret_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"finding_id" uuid NOT NULL,
	"secret_type" varchar(100) NOT NULL,
	"detected_value_hash" varchar(64) NOT NULL,
	"masked_preview" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branch_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid,
	"pattern" varchar(255) NOT NULL,
	"require_pull_request" boolean DEFAULT true NOT NULL,
	"required_approvals" integer DEFAULT 2 NOT NULL,
	"require_code_owners" boolean DEFAULT true NOT NULL,
	"require_ai_review" boolean DEFAULT true NOT NULL,
	"require_security_scan" boolean DEFAULT true NOT NULL,
	"require_tests" boolean DEFAULT true NOT NULL,
	"require_secret_scan" boolean DEFAULT true NOT NULL,
	"enforce_admins" boolean DEFAULT true NOT NULL,
	"prevent_force_push" boolean DEFAULT true NOT NULL,
	"prevent_deletion" boolean DEFAULT true NOT NULL,
	"require_signed_commits" boolean DEFAULT false NOT NULL,
	"require_linear_history" boolean DEFAULT true NOT NULL,
	"required_status_checks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"branch" varchar(255) NOT NULL,
	"pull_request_id" uuid,
	"requester_id" uuid NOT NULL,
	"requester_email" varchar(255) NOT NULL,
	"reason" text NOT NULL,
	"approved_by_id" uuid,
	"approved_by_email" varchar(255),
	"active_until" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"version" varchar(50) DEFAULT '1.0.0' NOT NULL,
	"level" varchar(50) DEFAULT 'ORGANIZATION' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_drift_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid NOT NULL,
	"branch" varchar(255) NOT NULL,
	"drift_status" varchar(50) NOT NULL,
	"expected_rules" jsonb NOT NULL,
	"actual_rules" jsonb NOT NULL,
	"discrepancies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"remediated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "policy_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"review_run_id" uuid NOT NULL,
	"outcome" varchar(50) NOT NULL,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evaluated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"rule_type" varchar(50) NOT NULL,
	"condition" jsonb NOT NULL,
	"action" varchar(50) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_violations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid,
	"actor_id" varchar(255) NOT NULL,
	"actor_type" varchar(50) NOT NULL,
	"branch" varchar(255) NOT NULL,
	"action" varchar(50) NOT NULL,
	"decision" varchar(50) NOT NULL,
	"reason" text NOT NULL,
	"policy_version" varchar(50) NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_id" varchar(255) NOT NULL,
	"actor_type" varchar(50) DEFAULT 'USER' NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" varchar(255) NOT NULL,
	"metadata" jsonb,
	"ip_address" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"repository_id" uuid,
	"type" varchar(50) NOT NULL,
	"channel" varchar(100),
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"payload" jsonb NOT NULL,
	"error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slack_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"team_id" varchar(100) NOT NULL,
	"team_name" varchar(255) NOT NULL,
	"access_token" text NOT NULL,
	"bot_user_id" varchar(100) NOT NULL,
	"default_channel_id" varchar(100),
	"default_channel_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_segments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) DEFAULT 'INDIVIDUAL' NOT NULL,
	"segment_id" uuid,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"profession" varchar(100) DEFAULT 'Developer',
	"organization_id" uuid,
	"primary_user_id" uuid,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"suspended_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"icon" varchar(100) DEFAULT 'check' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) DEFAULT 'BOOLEAN' NOT NULL,
	"default_value_json" jsonb DEFAULT 'false'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "features_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "plan_benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"benefit_id" uuid NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"feature_id" uuid NOT NULL,
	"value_json" jsonb NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"tier" varchar(50) DEFAULT 'BASIC' NOT NULL,
	"customer_type" varchar(50) DEFAULT 'INDIVIDUAL' NOT NULL,
	"description" text,
	"price_monthly" integer DEFAULT 0 NOT NULL,
	"price_yearly" integer DEFAULT 0 NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"trial_period_days" integer DEFAULT 14 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscription_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"previous_plan_id" uuid,
	"action" varchar(50) NOT NULL,
	"reason" text,
	"actor_user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"billing_interval" varchar(20) DEFAULT 'MONTHLY' NOT NULL,
	"current_period_start" timestamp with time zone DEFAULT now() NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"paused_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"subscription_id" uuid,
	"invoice_number" varchar(100) NOT NULL,
	"amount_due" integer DEFAULT 0 NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"status" varchar(50) DEFAULT 'PAID' NOT NULL,
	"invoice_pdf_url" text,
	"due_date" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"invoice_id" uuid,
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"status" varchar(50) DEFAULT 'SUCCEEDED' NOT NULL,
	"payment_method" varchar(50) DEFAULT 'CARD' NOT NULL,
	"provider" varchar(50) DEFAULT 'MOCK' NOT NULL,
	"provider_transaction_id" varchar(255),
	"failure_reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"feature_code" varchar(100) NOT NULL,
	"custom_limit" integer NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"feature_code" varchar(100) NOT NULL,
	"period_key" varchar(50) NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"limit" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"audience_type" varchar(50) DEFAULT 'EVERYONE' NOT NULL,
	"target_filter_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"priority" varchar(20) DEFAULT 'NORMAL' NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	"cta_text" varchar(100),
	"cta_url" text,
	"status" varchar(50) DEFAULT 'PUBLISHED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) DEFAULT 'INFO' NOT NULL,
	"priority" varchar(20) DEFAULT 'NORMAL' NOT NULL,
	"channels_json" jsonb DEFAULT '["IN_APP"]'::jsonb NOT NULL,
	"action_url" text,
	"target_audience_json" jsonb DEFAULT '{"type":"EVERYONE"}'::jsonb NOT NULL,
	"sender_user_id" uuid,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"sender_type" varchar(50) DEFAULT 'CUSTOMER' NOT NULL,
	"message" text NOT NULL,
	"attachments_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" varchar(50) NOT NULL,
	"customer_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100) DEFAULT 'TECHNICAL' NOT NULL,
	"priority" varchar(20) DEFAULT 'MEDIUM' NOT NULL,
	"status" varchar(50) DEFAULT 'OPEN' NOT NULL,
	"assigned_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) DEFAULT 'GUIDE' NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer DEFAULT 0 NOT NULL,
	"mime_type" varchar(100) DEFAULT 'application/pdf' NOT NULL,
	"required_feature_code" varchar(100),
	"min_plan_tier" varchar(50) DEFAULT 'BASIC' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "impersonation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"target_customer_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"device_info" varchar(255),
	"ip_address" varchar(45),
	"expires_at" timestamp with time zone NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_valid" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_commits" ADD CONSTRAINT "repository_commits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_commits" ADD CONSTRAINT "repository_commits_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_files" ADD CONSTRAINT "repository_files_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_files" ADD CONSTRAINT "repository_files_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_installations" ADD CONSTRAINT "repository_installations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_snapshots" ADD CONSTRAINT "repository_snapshots_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repository_snapshots" ADD CONSTRAINT "repository_snapshots_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_endpoints" ADD CONSTRAINT "api_endpoints_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_endpoints" ADD CONSTRAINT "api_endpoints_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_endpoints" ADD CONSTRAINT "api_endpoints_handler_symbol_id_code_symbols_id_fk" FOREIGN KEY ("handler_symbol_id") REFERENCES "public"."code_symbols"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_chunks" ADD CONSTRAINT "code_chunks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_chunks" ADD CONSTRAINT "code_chunks_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_chunks" ADD CONSTRAINT "code_chunks_symbol_id_code_symbols_id_fk" FOREIGN KEY ("symbol_id") REFERENCES "public"."code_symbols"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_embeddings" ADD CONSTRAINT "code_embeddings_chunk_id_code_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."code_chunks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_relationships" ADD CONSTRAINT "code_relationships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_relationships" ADD CONSTRAINT "code_relationships_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_relationships" ADD CONSTRAINT "code_relationships_source_symbol_id_code_symbols_id_fk" FOREIGN KEY ("source_symbol_id") REFERENCES "public"."code_symbols"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_relationships" ADD CONSTRAINT "code_relationships_target_symbol_id_code_symbols_id_fk" FOREIGN KEY ("target_symbol_id") REFERENCES "public"."code_symbols"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_symbols" ADD CONSTRAINT "code_symbols_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_symbols" ADD CONSTRAINT "code_symbols_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dependencies" ADD CONSTRAINT "dependencies_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_request_commits" ADD CONSTRAINT "pull_request_commits_pull_request_id_pull_requests_id_fk" FOREIGN KEY ("pull_request_id") REFERENCES "public"."pull_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_request_files" ADD CONSTRAINT "pull_request_files_pull_request_id_pull_requests_id_fk" FOREIGN KEY ("pull_request_id") REFERENCES "public"."pull_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_runs" ADD CONSTRAINT "review_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_runs" ADD CONSTRAINT "review_runs_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_runs" ADD CONSTRAINT "review_runs_pull_request_id_pull_requests_id_fk" FOREIGN KEY ("pull_request_id") REFERENCES "public"."pull_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_stages" ADD CONSTRAINT "review_stages_review_run_id_review_runs_id_fk" FOREIGN KEY ("review_run_id") REFERENCES "public"."review_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dependency_findings" ADD CONSTRAINT "dependency_findings_finding_id_review_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."review_findings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_findings" ADD CONSTRAINT "review_findings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_findings" ADD CONSTRAINT "review_findings_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_findings" ADD CONSTRAINT "review_findings_pull_request_id_pull_requests_id_fk" FOREIGN KEY ("pull_request_id") REFERENCES "public"."pull_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_findings" ADD CONSTRAINT "review_findings_review_run_id_review_runs_id_fk" FOREIGN KEY ("review_run_id") REFERENCES "public"."review_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "secret_findings" ADD CONSTRAINT "secret_findings_finding_id_review_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."review_findings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_policies" ADD CONSTRAINT "branch_policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_policies" ADD CONSTRAINT "branch_policies_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_overrides" ADD CONSTRAINT "emergency_overrides_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_overrides" ADD CONSTRAINT "emergency_overrides_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_overrides" ADD CONSTRAINT "emergency_overrides_pull_request_id_pull_requests_id_fk" FOREIGN KEY ("pull_request_id") REFERENCES "public"."pull_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_overrides" ADD CONSTRAINT "emergency_overrides_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_overrides" ADD CONSTRAINT "emergency_overrides_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_drift_logs" ADD CONSTRAINT "policy_drift_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_drift_logs" ADD CONSTRAINT "policy_drift_logs_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_executions" ADD CONSTRAINT "policy_executions_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_executions" ADD CONSTRAINT "policy_executions_review_run_id_review_runs_id_fk" FOREIGN KEY ("review_run_id") REFERENCES "public"."review_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_rules" ADD CONSTRAINT "policy_rules_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_violations" ADD CONSTRAINT "policy_violations_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_notifications" ADD CONSTRAINT "integration_notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_notifications" ADD CONSTRAINT "integration_notifications_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slack_integrations" ADD CONSTRAINT "slack_integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_segment_id_customer_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."customer_segments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_primary_user_id_users_id_fk" FOREIGN KEY ("primary_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_benefits" ADD CONSTRAINT "plan_benefits_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_benefits" ADD CONSTRAINT "plan_benefits_benefit_id_benefits_id_fk" FOREIGN KEY ("benefit_id") REFERENCES "public"."benefits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_features" ADD CONSTRAINT "plan_features_feature_id_features_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_previous_plan_id_plans_id_fk" FOREIGN KEY ("previous_plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_history" ADD CONSTRAINT "subscription_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_limits" ADD CONSTRAINT "usage_limits_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_admin_id_users_id_fk" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_target_customer_id_customers_id_fk" FOREIGN KEY ("target_customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_org_idx" ON "api_keys" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_hash_idx" ON "api_keys" USING btree ("hashed_key");--> statement-breakpoint
CREATE INDEX "memberships_org_idx" ON "memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_user_membership_idx" ON "memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "teams_org_idx" ON "teams" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_org_slug_idx" ON "teams" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "repo_org_idx" ON "repositories" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repo_provider_unique_idx" ON "repositories" USING btree ("provider","provider_repo_id");--> statement-breakpoint
CREATE INDEX "repo_full_name_idx" ON "repositories" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "repo_commits_org_idx" ON "repository_commits" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "repo_commits_repo_idx" ON "repository_commits" USING btree ("repository_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repo_commit_sha_idx" ON "repository_commits" USING btree ("repository_id","sha");--> statement-breakpoint
CREATE INDEX "repo_files_org_idx" ON "repository_files" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "repo_files_repo_idx" ON "repository_files" USING btree ("repository_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repo_file_commit_path_idx" ON "repository_files" USING btree ("repository_id","commit_sha","path");--> statement-breakpoint
CREATE INDEX "repo_inst_org_idx" ON "repository_installations" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inst_id_idx" ON "repository_installations" USING btree ("installation_id");--> statement-breakpoint
CREATE INDEX "repo_snapshots_org_idx" ON "repository_snapshots" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repo_snapshot_commit_idx" ON "repository_snapshots" USING btree ("repository_id","commit_sha");--> statement-breakpoint
CREATE INDEX "api_org_repo_idx" ON "api_endpoints" USING btree ("organization_id","repository_id");--> statement-breakpoint
CREATE INDEX "api_route_idx" ON "api_endpoints" USING btree ("http_method","route_path");--> statement-breakpoint
CREATE INDEX "chunks_org_repo_idx" ON "code_chunks" USING btree ("organization_id","repository_id");--> statement-breakpoint
CREATE INDEX "chunks_file_idx" ON "code_chunks" USING btree ("file_path");--> statement-breakpoint
CREATE INDEX "chunks_commit_idx" ON "code_chunks" USING btree ("commit_sha");--> statement-breakpoint
CREATE INDEX "embeddings_chunk_idx" ON "code_embeddings" USING btree ("chunk_id");--> statement-breakpoint
CREATE INDEX "rel_org_repo_idx" ON "code_relationships" USING btree ("organization_id","repository_id");--> statement-breakpoint
CREATE INDEX "rel_source_idx" ON "code_relationships" USING btree ("source_symbol_id");--> statement-breakpoint
CREATE INDEX "rel_target_idx" ON "code_relationships" USING btree ("target_symbol_id");--> statement-breakpoint
CREATE INDEX "rel_type_idx" ON "code_relationships" USING btree ("relation_type");--> statement-breakpoint
CREATE INDEX "symbol_org_repo_idx" ON "code_symbols" USING btree ("organization_id","repository_id");--> statement-breakpoint
CREATE INDEX "symbol_name_idx" ON "code_symbols" USING btree ("name");--> statement-breakpoint
CREATE INDEX "symbol_file_idx" ON "code_symbols" USING btree ("file_path");--> statement-breakpoint
CREATE INDEX "symbol_commit_idx" ON "code_symbols" USING btree ("commit_sha");--> statement-breakpoint
CREATE INDEX "dep_org_repo_idx" ON "dependencies" USING btree ("organization_id","repository_id");--> statement-breakpoint
CREATE INDEX "dep_name_idx" ON "dependencies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "pr_commits_pr_idx" ON "pull_request_commits" USING btree ("pull_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pr_commit_sha_idx" ON "pull_request_commits" USING btree ("pull_request_id","sha");--> statement-breakpoint
CREATE INDEX "pr_files_pr_idx" ON "pull_request_files" USING btree ("pull_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pr_file_path_idx" ON "pull_request_files" USING btree ("pull_request_id","file_path");--> statement-breakpoint
CREATE INDEX "pr_org_idx" ON "pull_requests" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "pr_repo_idx" ON "pull_requests" USING btree ("repository_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pr_repo_number_idx" ON "pull_requests" USING btree ("repository_id","number");--> statement-breakpoint
CREATE INDEX "review_runs_org_idx" ON "review_runs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "review_runs_repo_idx" ON "review_runs" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "review_runs_pr_idx" ON "review_runs" USING btree ("pull_request_id");--> statement-breakpoint
CREATE INDEX "review_runs_state_idx" ON "review_runs" USING btree ("state");--> statement-breakpoint
CREATE INDEX "review_stages_run_idx" ON "review_stages" USING btree ("review_run_id");--> statement-breakpoint
CREATE INDEX "dep_finding_idx" ON "dependency_findings" USING btree ("finding_id");--> statement-breakpoint
CREATE INDEX "dep_cve_idx" ON "dependency_findings" USING btree ("cve_id");--> statement-breakpoint
CREATE INDEX "findings_org_idx" ON "review_findings" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "findings_repo_idx" ON "review_findings" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "findings_pr_idx" ON "review_findings" USING btree ("pull_request_id");--> statement-breakpoint
CREATE INDEX "findings_run_idx" ON "review_findings" USING btree ("review_run_id");--> statement-breakpoint
CREATE INDEX "findings_fingerprint_idx" ON "review_findings" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "findings_severity_idx" ON "review_findings" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "findings_status_idx" ON "review_findings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "secret_finding_idx" ON "secret_findings" USING btree ("finding_id");--> statement-breakpoint
CREATE INDEX "secret_hash_idx" ON "secret_findings" USING btree ("detected_value_hash");--> statement-breakpoint
CREATE INDEX "branch_policy_org_idx" ON "branch_policies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "branch_policy_repo_idx" ON "branch_policies" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "emergency_org_idx" ON "emergency_overrides" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "emergency_repo_idx" ON "emergency_overrides" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "policies_org_idx" ON "policies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "policies_repo_idx" ON "policies" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "drift_org_idx" ON "policy_drift_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "drift_repo_idx" ON "policy_drift_logs" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "exec_policy_idx" ON "policy_executions" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "exec_review_idx" ON "policy_executions" USING btree ("review_run_id");--> statement-breakpoint
CREATE INDEX "rules_policy_idx" ON "policy_rules" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "violations_org_idx" ON "policy_violations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "violations_repo_idx" ON "policy_violations" USING btree ("repository_id");--> statement-breakpoint
CREATE INDEX "violations_actor_idx" ON "policy_violations" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_org_idx" ON "audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "int_notif_org_idx" ON "integration_notifications" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "int_notif_status_idx" ON "integration_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "slack_org_idx" ON "slack_integrations" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_segment_slug_idx" ON "customer_segments" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "customers_org_idx" ON "customers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "customers_user_idx" ON "customers" USING btree ("primary_user_id");--> statement-breakpoint
CREATE INDEX "customers_type_idx" ON "customers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "customers_status_idx" ON "customers" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_code_idx" ON "features" USING btree ("code");--> statement-breakpoint
CREATE INDEX "plan_benefits_plan_idx" ON "plan_benefits" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plan_benefits_benefit_idx" ON "plan_benefits" USING btree ("benefit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_benefit_unique_idx" ON "plan_benefits" USING btree ("plan_id","benefit_id");--> statement-breakpoint
CREATE INDEX "plan_features_plan_idx" ON "plan_features" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plan_features_feature_idx" ON "plan_features" USING btree ("feature_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_feature_unique_idx" ON "plan_features" USING btree ("plan_id","feature_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_slug_idx" ON "plans" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "plan_tier_idx" ON "plans" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "plan_active_idx" ON "plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sub_history_sub_idx" ON "subscription_history" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "sub_history_customer_idx" ON "subscription_history" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "sub_history_created_idx" ON "subscription_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "subs_customer_idx" ON "subscriptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "subs_plan_idx" ON "subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "subs_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_num_idx" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_customer_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_customer_idx" ON "payments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "payments_invoice_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "custom_limits_customer_idx" ON "usage_limits" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_limit_unique_idx" ON "usage_limits" USING btree ("customer_id","feature_code");--> statement-breakpoint
CREATE INDEX "usage_customer_idx" ON "usage_records" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_customer_feature_period_idx" ON "usage_records" USING btree ("customer_id","feature_code","period_key");--> statement-breakpoint
CREATE INDEX "announcements_status_idx" ON "announcements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "announcements_audience_idx" ON "announcements" USING btree ("audience_type");--> statement-breakpoint
CREATE INDEX "notif_recip_user_idx" ON "notification_recipients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notif_recip_customer_idx" ON "notification_recipients" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "notif_recip_unread_idx" ON "notification_recipients" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_priority_idx" ON "notifications" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "notifications_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "support_messages_ticket_idx" ON "support_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "support_messages_created_idx" ON "support_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_number_idx" ON "support_tickets" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "support_customer_idx" ON "support_tickets" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "support_user_idx" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_category_idx" ON "documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "documents_tier_idx" ON "documents" USING btree ("min_plan_tier");--> statement-breakpoint
CREATE INDEX "impersonate_admin_idx" ON "impersonation_sessions" USING btree ("admin_user_id");--> statement-breakpoint
CREATE INDEX "impersonate_customer_idx" ON "impersonation_sessions" USING btree ("target_customer_id");--> statement-breakpoint
CREATE INDEX "impersonate_active_idx" ON "impersonation_sessions" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_idx" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");