import postgres from 'postgres';
import { config } from '@codeguard/config';
import { logger } from '@codeguard/logger';

export async function runMigrations() {
  logger.info('🚀 Running CodeGuard Database Migrations...');
  const sql = postgres(config.DATABASE_URL, { max: 1 });

  try {
    // 1. Extensions
    await sql.unsafe(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      CREATE EXTENSION IF NOT EXISTS "vector";
    `);

    // 2. Organizations
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        avatar_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Users, Teams, Memberships, API Keys
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_team_org_slug UNIQUE (organization_id, slug)
      );

      CREATE TABLE IF NOT EXISTS memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_membership_org_user UNIQUE (organization_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        key_prefix VARCHAR(16) NOT NULL,
        hashed_key TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ,
        last_used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Repositories
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS repositories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL DEFAULT 'github',
        provider_repo_id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        private BOOLEAN NOT NULL DEFAULT true,
        default_branch VARCHAR(100) NOT NULL DEFAULT 'main',
        clone_url TEXT NOT NULL,
        installation_id VARCHAR(100),
        last_indexed_commit_sha VARCHAR(64),
        last_indexed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE repositories ADD COLUMN IF NOT EXISTS last_indexed_commit_sha VARCHAR(64);
      ALTER TABLE repositories ADD COLUMN IF NOT EXISTS last_indexed_at TIMESTAMPTZ;
    `);

    // 5. Code Graph & Intelligence
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS code_symbols (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        commit_sha VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        kind VARCHAR(50) NOT NULL,
        file_path TEXT NOT NULL,
        start_line INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        signature TEXT,
        docstring TEXT,
        content_hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS graph_relationships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        commit_sha VARCHAR(64) NOT NULL,
        source_symbol_id UUID NOT NULL REFERENCES code_symbols(id) ON DELETE CASCADE,
        target_symbol_id UUID NOT NULL REFERENCES code_symbols(id) ON DELETE CASCADE,
        relation_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS code_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        symbol_id UUID REFERENCES code_symbols(id) ON DELETE CASCADE,
        file_path TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding vector(1536) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 6. Pull Requests, Review Runs, Review Stages, Findings
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS pull_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        number INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        state VARCHAR(50) NOT NULL DEFAULT 'OPEN',
        source_branch VARCHAR(255) NOT NULL,
        target_branch VARCHAR(255) NOT NULL,
        head_sha VARCHAR(64) NOT NULL,
        base_sha VARCHAR(64) NOT NULL,
        author_username VARCHAR(255) NOT NULL DEFAULT 'unknown',
        is_draft BOOLEAN NOT NULL DEFAULT false,
        opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        merged_at TIMESTAMPTZ,
        closed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE pull_requests ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
      ALTER TABLE pull_requests ADD COLUMN IF NOT EXISTS number INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE pull_requests ADD COLUMN IF NOT EXISTS author_username VARCHAR(255) NOT NULL DEFAULT 'unknown';
      ALTER TABLE pull_requests ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE pull_requests ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
      ALTER TABLE pull_requests ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ;
      ALTER TABLE pull_requests ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

      CREATE TABLE IF NOT EXISTS review_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        pull_request_id UUID NOT NULL REFERENCES pull_requests(id) ON DELETE CASCADE,
        commit_sha VARCHAR(64) NOT NULL,
        state VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
        policy_outcome VARCHAR(50),
        summary TEXT,
        critical_count INTEGER NOT NULL DEFAULT 0,
        high_count INTEGER NOT NULL DEFAULT 0,
        medium_count INTEGER NOT NULL DEFAULT 0,
        low_count INTEGER NOT NULL DEFAULT 0,
        info_count INTEGER NOT NULL DEFAULT 0,
        duration_ms INTEGER,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS review_stages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        review_run_id UUID NOT NULL REFERENCES review_runs(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        duration_ms INTEGER,
        error TEXT
      );

      CREATE TABLE IF NOT EXISTS review_findings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        pull_request_id UUID REFERENCES pull_requests(id) ON DELETE CASCADE,
        review_run_id UUID REFERENCES review_runs(id) ON DELETE CASCADE,
        fingerprint VARCHAR(64) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        source VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        file_path TEXT NOT NULL,
        start_line INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        evidence TEXT,
        impact TEXT,
        recommendation TEXT,
        rule_id VARCHAR(100),
        confidence REAL NOT NULL DEFAULT 1.0,
        blocking BOOLEAN NOT NULL DEFAULT false,
        status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE review_findings ADD COLUMN IF NOT EXISTS policy_id UUID;
      ALTER TABLE review_findings ADD COLUMN IF NOT EXISTS dismissed_reason TEXT;
      ALTER TABLE review_findings ADD COLUMN IF NOT EXISTS dismissed_by_user_id UUID;
      ALTER TABLE review_findings ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;
    `);

    // 7. Policies, Policy Rules, Policy Executions
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS policies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
        level VARCHAR(50) NOT NULL DEFAULT 'ORGANIZATION',
        is_default BOOLEAN NOT NULL DEFAULT false,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE policies ADD COLUMN IF NOT EXISTS version VARCHAR(50) DEFAULT '1.0.0';
      ALTER TABLE policies ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'ORGANIZATION';

      CREATE TABLE IF NOT EXISTS policy_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        rule_type VARCHAR(50) NOT NULL,
        condition JSONB NOT NULL DEFAULT '{}'::jsonb,
        action VARCHAR(50) NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS policy_executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
        review_run_id UUID NOT NULL REFERENCES review_runs(id) ON DELETE CASCADE,
        outcome VARCHAR(50) NOT NULL,
        reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
        evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        actor_id VARCHAR(255) NOT NULL,
        actor_type VARCHAR(50) NOT NULL DEFAULT 'USER',
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100) NOT NULL,
        resource_id VARCHAR(255) NOT NULL,
        metadata JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 8. Subscriber Management & Customer Portal Platform
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS customer_segments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL DEFAULT 'INDIVIDUAL',
        segment_id UUID REFERENCES customer_segments(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        profession VARCHAR(100) DEFAULT 'Developer',
        organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
        primary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        suspended_reason TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        tier VARCHAR(50) NOT NULL DEFAULT 'BASIC',
        customer_type VARCHAR(50) NOT NULL DEFAULT 'INDIVIDUAL',
        description TEXT,
        price_monthly INTEGER NOT NULL DEFAULT 0,
        price_yearly INTEGER NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        trial_period_days INTEGER NOT NULL DEFAULT 14,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_public BOOLEAN NOT NULL DEFAULT true,
        display_order INTEGER NOT NULL DEFAULT 0,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL DEFAULT 'BOOLEAN',
        default_value_json JSONB NOT NULL DEFAULT 'false'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS benefits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(100) NOT NULL DEFAULT 'check',
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS plan_features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
        value_json JSONB NOT NULL,
        is_enabled BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_plan_feature UNIQUE (plan_id, feature_id)
      );

      CREATE TABLE IF NOT EXISTS plan_benefits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        benefit_id UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_plan_benefit UNIQUE (plan_id, benefit_id)
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES plans(id),
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        billing_interval VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
        current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        current_period_end TIMESTAMPTZ NOT NULL,
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
        trial_ends_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        paused_at TIMESTAMPTZ,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subscription_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES plans(id),
        previous_plan_id UUID REFERENCES plans(id),
        action VARCHAR(50) NOT NULL,
        reason TEXT,
        actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
        invoice_number VARCHAR(100) NOT NULL UNIQUE,
        amount_due INTEGER NOT NULL DEFAULT 0,
        amount_paid INTEGER NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        status VARCHAR(50) NOT NULL DEFAULT 'PAID',
        invoice_pdf_url TEXT,
        due_date TIMESTAMPTZ,
        paid_at TIMESTAMPTZ,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
        amount INTEGER NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        status VARCHAR(50) NOT NULL DEFAULT 'SUCCEEDED',
        payment_method VARCHAR(50) NOT NULL DEFAULT 'CARD',
        provider VARCHAR(50) NOT NULL DEFAULT 'MOCK',
        provider_transaction_id VARCHAR(255),
        failure_reason TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS usage_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        feature_code VARCHAR(100) NOT NULL,
        period_key VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        "limit" INTEGER,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_usage_customer_feature_period UNIQUE (customer_id, feature_code, period_key)
      );

      ALTER TABLE usage_records ADD COLUMN IF NOT EXISTS "limit" INTEGER;

      CREATE TABLE IF NOT EXISTS usage_limits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        feature_code VARCHAR(100) NOT NULL,
        custom_limit INTEGER NOT NULL,
        reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_usage_limit_feature UNIQUE (customer_id, feature_code)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'INFO',
        priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
        channels_json JSONB NOT NULL DEFAULT '["IN_APP"]'::jsonb,
        action_url TEXT,
        target_audience_json JSONB NOT NULL DEFAULT '{"type":"EVERYONE"}'::jsonb,
        sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notification_recipients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        is_read BOOLEAN NOT NULL DEFAULT false,
        read_at TIMESTAMPTZ,
        is_dismissed BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        audience_type VARCHAR(50) NOT NULL DEFAULT 'EVERYONE',
        target_filter_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
        start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        end_date TIMESTAMPTZ,
        cta_text VARCHAR(100),
        cta_url TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number VARCHAR(50) NOT NULL UNIQUE,
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'TECHNICAL',
        priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
        status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
        assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS support_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        sender_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_type VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
        message TEXT NOT NULL,
        attachments_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL DEFAULT 'GUIDE',
        file_url TEXT NOT NULL,
        file_size INTEGER NOT NULL DEFAULT 0,
        mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
        required_feature_code VARCHAR(100),
        min_plan_tier VARCHAR(50) NOT NULL DEFAULT 'BASIC',
        is_public BOOLEAN NOT NULL DEFAULT false,
        download_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        device_info VARCHAR(255),
        ip_address VARCHAR(45),
        expires_at TIMESTAMPTZ NOT NULL,
        last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        is_valid BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS impersonation_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    logger.info('✅ All CodeGuard database tables & vector extensions initialized successfully!');
  } catch (err) {
    logger.error({ err }, 'Migration failed');
    throw err;
  } finally {
    await sql.end();
  }
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
  runMigrations().then(() => process.exit(0));
}
