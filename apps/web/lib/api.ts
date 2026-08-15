import {
  DashboardStats,
  ReviewRunItem,
  FindingItem,
  UsageMeterItem,
  BenefitItem,
  InvoiceItem,
  TeamMemberItem,
  DocumentItem,
  SupportTicketItem,
  CustomerAdminItem,
  PlanCatalogItem,
  AuditLogItem,
  DemoPersonaRole,
} from './types';

const API_BASE = '/api/v1';

// MOCK DATA STORE FOR INSTANT DEMO & RESILIENCE
export const MOCK_STATS: DashboardStats = {
  counts: {
    organizations: 14,
    repositories: 86,
    pullRequests: 412,
    reviews: 1248,
    criticalFindings: 3,
    highFindings: 11,
    activeModel: 'Google Gemini 3.7 Flash',
  },
  recentReviews: [
    {
      id: 'rev-891a-45bc',
      repositoryName: 'payments-service',
      pullRequestTitle: 'feat: add zero-trust idempotent charge pipeline',
      prNumber: 142,
      branch: 'feature/idempotent-charges',
      status: 'COMPLETED',
      verdict: 'APPROVED',
      summary: 'Verified clean AST, passed SHA-256 entropy secret scan, Gemini 3.7 detected no concurrency race conditions.',
      executionTimeMs: 1420,
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      criticalCount: 0,
      highCount: 0,
      medCount: 1,
    },
    {
      id: 'rev-772b-88fd',
      repositoryName: 'auth-gateway',
      pullRequestTitle: 'fix(jwt): validate token issuer and refresh clock skew',
      prNumber: 98,
      branch: 'fix/jwt-skew',
      status: 'COMPLETED',
      verdict: 'BLOCKED',
      summary: 'Policy Block: Critical secret pattern detected in test fixture (raw GitHub Personal Access Token leaked).',
      executionTimeMs: 980,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      criticalCount: 1,
      highCount: 2,
      medCount: 0,
    },
    {
      id: 'rev-663c-11ef',
      repositoryName: 'customer-portal-web',
      pullRequestTitle: 'refactor: modernize billing checkout with React 19',
      prNumber: 304,
      branch: 'refactor/billing-v2',
      status: 'COMPLETED',
      verdict: 'APPROVED',
      summary: 'AST Code Graph impact verification passed across 18 downstream components.',
      executionTimeMs: 2150,
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      criticalCount: 0,
      highCount: 0,
      medCount: 0,
    },
  ],
  recentFindings: [
    {
      id: 'fnd-901',
      tool: 'SECRET_SCANNER',
      severity: 'CRITICAL',
      category: 'Secret Leakage',
      title: 'High-Entropy Secret in Test Environment Fixture',
      description: 'Found plaintext GitHub fine-grained token `ghp_xxxxxxxxxxxx` committed in mock spec.',
      file: 'packages/auth/tests/mock.spec.ts',
      lineStart: 42,
      lineEnd: 42,
      codeSnippet: 'const TEST_TOKEN = "ghp_9104810948109283019283019283019283";',
      suggestedFix: 'Use process.env.TEST_GITHUB_TOKEN or a cryptographically zeroed dummy token string.',
      isAiVerified: true,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'fnd-902',
      tool: 'GEMINI_AI',
      severity: 'HIGH',
      category: 'Concurrency Race',
      title: 'Unchecked Atomic Balance Decrement',
      description: 'Race condition detected where concurrent checkout requests can cause double-spending before DB row locking.',
      file: 'apps/api/src/services/billing.ts',
      lineStart: 118,
      lineEnd: 126,
      codeSnippet: 'const user = await db.getUser(id);\nif (user.balance >= cost) {\n  await db.updateBalance(id, user.balance - cost);\n}',
      suggestedFix: 'Wrap balance check and debit in a `SELECT FOR UPDATE` transaction or SQL decrement expression.',
      isAiVerified: true,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    },
    {
      id: 'fnd-903',
      tool: 'AST_PARSER',
      severity: 'MEDIUM',
      category: 'Architecture Violation',
      title: 'Forbidden Direct DB Import in Client Layer',
      description: 'Client component imports internal database connection pool directly instead of calling API facade.',
      file: 'apps/web/components/BillingTable.tsx',
      lineStart: 4,
      lineEnd: 4,
      codeSnippet: "import { dbPool } from '@codeguard/database';",
      suggestedFix: "Use typed API client fetch from '@codeguard/api-client' to preserve separation of concerns.",
      isAiVerified: true,
      status: 'ACTIVE',
      createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    },
  ],
  activePolicies: [
    { name: 'Zero-Trust Secret Block', ruleType: 'SECRET_BLOCK', action: 'BLOCK', enabled: true },
    { name: 'Gemini 3.7 Critical Vulnerability Gate', ruleType: 'SEVERITY_THRESHOLD', action: 'BLOCK', enabled: true },
    { name: 'Require 2 Approvals on Main Branch', ruleType: 'PROTECTED_BRANCH', action: 'REQUIRE_APPROVAL', enabled: true },
  ],
};

export const MOCK_METERS: Record<string, UsageMeterItem> = {
  monthly_prs_reviewed: {
    name: 'Monthly PRs Reviewed',
    current: 42,
    limit: 100,
    percentage: 42,
    isWarning: false,
    isExceeded: false,
  },
  ai_verifications: {
    name: 'Gemini 3.7 AI Verifications',
    current: 184,
    limit: 500,
    percentage: 36.8,
    isWarning: false,
    isExceeded: false,
  },
  secret_scans: {
    name: 'Real-time AST Secret Scans',
    current: 1240,
    limit: 5000,
    percentage: 24.8,
    isWarning: false,
    isExceeded: false,
  },
  active_repositories: {
    name: 'Monitored Repositories',
    current: 4,
    limit: 10,
    percentage: 40,
    isWarning: false,
    isExceeded: false,
  },
  team_seats: {
    name: 'Developer Seats Allocation',
    current: 3,
    limit: 5,
    percentage: 60,
    isWarning: false,
    isExceeded: false,
  },
};

export const MOCK_BENEFITS: BenefitItem[] = [
  { id: 'b1', name: 'Gemini 3.7 Flash AI Reviewer', description: 'Real-time automated code reviews with zero-hallucination verification pipeline.', category: 'AI', minTier: 'PRO' },
  { id: 'b2', name: 'AST & Code Graph Impact Engine', description: 'Traces cross-file dependencies and semantic symbol graphs on every commit.', category: 'Analysis', minTier: 'PRO' },
  { id: 'b3', name: 'Continuous Secret Scanner', description: 'Zero-trust entropy analysis detecting 80+ API keys, tokens, and credentials.', category: 'Security', minTier: 'ALL' },
  { id: 'b4', name: 'Break-Glass Emergency Bypass', description: 'Cryptographically audited emergency override protocol with SLA tracking.', category: 'Governance', minTier: 'ENTERPRISE' },
  { id: 'b5', name: 'Automated GitHub Check Runs', description: 'Native PR status annotations with line-by-line remediation diffs.', category: 'Integration', minTier: 'ALL' },
  { id: 'b6', name: 'SOC2 & HIPAA Compliance Blueprints', description: 'One-click compliance pack generator and immutable audit logs.', category: 'Compliance', minTier: 'PRO' },
];

export const MOCK_INVOICES: InvoiceItem[] = [
  { id: 'inv-001', invoiceNumber: 'INV-2026-0041', createdAt: '2026-08-01T00:00:00Z', amountDue: 2900, status: 'PAID', description: 'CodeGuard Pro Plan (Monthly Recurring)' },
  { id: 'inv-002', invoiceNumber: 'INV-2026-0028', createdAt: '2026-07-01T00:00:00Z', amountDue: 2900, status: 'PAID', description: 'CodeGuard Pro Plan (Monthly Recurring)' },
  { id: 'inv-003', invoiceNumber: 'INV-2026-0012', createdAt: '2026-06-01T00:00:00Z', amountDue: 2900, status: 'PAID', description: 'CodeGuard Pro Plan (Monthly Recurring)' },
];

export const MOCK_MEMBERS: TeamMemberItem[] = [
  { id: 'm1', userId: 'u1', name: 'Elena Rostova', email: 'elena@codeguard.dev', role: 'OWNER', joinedAt: '2026-01-15T00:00:00Z' },
  { id: 'm2', userId: 'u2', name: 'Marcus Chen', email: 'marcus@codeguard.dev', role: 'SECURITY_LEAD', joinedAt: '2026-02-10T00:00:00Z' },
  { id: 'm3', userId: 'u3', name: 'Aria Thorne', email: 'aria@codeguard.dev', role: 'MEMBER', joinedAt: '2026-03-01T00:00:00Z' },
];

export const MOCK_DOCS: DocumentItem[] = [
  { id: 'doc-1', title: 'SOC2 Type II Security Architecture Blueprint', description: 'Complete zero-trust architectural blueprint detailing encryption at rest, in-transit, and RBAC matrix.', category: 'SOC2', minPlanTier: 'PRO', slug: 'soc2-blueprint', updatedAt: '2026-08-01' },
  { id: 'doc-2', title: 'Gemini 3.7 Flash AI Reviewer Integration Guide', description: 'Step-by-step developer guide for setting up AST symbol indexing and fine-grained repository prompts.', category: 'API', minPlanTier: 'ALL', slug: 'gemini-integration', updatedAt: '2026-08-10' },
  { id: 'doc-3', title: 'Break-Glass Emergency Access & Incident Protocol', description: 'SLA definitions, immutable audit trails, and multi-signature authorization for deployment freezes.', category: 'SECURITY', minPlanTier: 'ENTERPRISE', slug: 'break-glass-sla', updatedAt: '2026-07-28' },
  { id: 'doc-4', title: 'Enterprise GitHub Webhook & Check Run Spec', description: 'Payload formats, signature verification (HMAC SHA-256), and automated PR remediation comments.', category: 'ARCHITECTURE', minPlanTier: 'ALL', slug: 'github-webhook-spec', updatedAt: '2026-08-05' },
];

export const MOCK_TICKETS: SupportTicketItem[] = [
  { id: 't-8819', subject: 'Inquiry regarding custom AST rules for internal monorepo packages', category: 'Technical Support', priority: 'MEDIUM', status: 'IN_PROGRESS', createdAt: '2026-08-14T09:20:00Z' },
  { id: 't-7721', subject: 'Request for custom Gemini token rate-limit expansion', category: 'Billing & Limits', priority: 'HIGH', status: 'RESOLVED', createdAt: '2026-08-02T14:15:00Z' },
];

export const MOCK_CUSTOMERS: CustomerAdminItem[] = [
  { id: 'c-1', name: 'Acme Payments Corp', email: 'security@acmepayments.com', type: 'ORGANIZATION', activePlan: { name: 'Enterprise Security Suite', tier: 'ENTERPRISE', priceMonthly: 49900 }, status: 'ACTIVE', createdAt: '2026-01-10T00:00:00Z' },
  { id: 'c-2', name: 'Elena Rostova', email: 'elena@codeguard.dev', type: 'PROFESSIONAL', activePlan: { name: 'Pro Engineer', tier: 'PRO', priceMonthly: 2900 }, status: 'ACTIVE', createdAt: '2026-02-14T00:00:00Z' },
  { id: 'c-3', name: 'Alex Rivera', email: 'alex@stanford.edu', type: 'INDIVIDUAL', activePlan: { name: 'Student Developer', tier: 'FREE', priceMonthly: 0 }, status: 'ACTIVE', createdAt: '2026-04-01T00:00:00Z' },
  { id: 'c-4', name: 'Vortex Cloud Robotics', email: 'devops@vortexrobotics.io', type: 'ORGANIZATION', activePlan: { name: 'Enterprise Security Suite', tier: 'ENTERPRISE', priceMonthly: 49900 }, status: 'TRIAL', createdAt: '2026-08-05T00:00:00Z' },
];

export const MOCK_PLANS: PlanCatalogItem[] = [
  {
    id: 'plan-student',
    name: 'Student & OSS Developer',
    slug: 'basic-student',
    tier: 'FREE',
    priceMonthly: 0,
    description: 'Essential AI code review and secret scanning for student developers and open source projects.',
    features: ['10 PR reviews / month', 'AST Syntax & Bug Scanner', 'Community Discord Support', 'Public GitHub Repositories'],
  },
  {
    id: 'plan-pro',
    name: 'Pro Engineer',
    slug: 'pro',
    tier: 'PRO',
    priceMonthly: 2900,
    isPopular: true,
    description: 'High-performance AI verification, continuous secret protection, and AST graph analysis for professional engineers.',
    features: ['100 PR reviews / month', 'Google Gemini 3.7 Flash Reviewer', 'Code Graph Impact Analysis', 'Private Repositories', 'SOC2 Compliance Blueprints', 'Priority Support (2h SLA)'],
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise Organization',
    slug: 'enterprise',
    tier: 'ENTERPRISE',
    priceMonthly: 49900,
    description: 'Full-scale code governance, branch protection, multi-tenant RBAC, and Break-Glass emergency overrides for engineering organizations.',
    features: ['Unlimited PR Reviews', 'Multi-tenant RBAC & Seat Controls', 'Break-Glass Emergency Bypass', 'Custom AST Security Rules', 'Dedicated Security Architect', 'Immutable Audit Logs & Export'],
  },
];

export const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  { id: 'aud-101', createdAt: '2026-08-15T05:30:00Z', actorType: 'ADMIN', action: 'EMERGENCY_OVERRIDE_ENABLED', resourceType: 'REPOSITORY', resourceId: 'payments-service', metadata: { reason: 'Hotfix for payment gateway failover', requester: 'elena@codeguard.dev' } },
  { id: 'aud-102', createdAt: '2026-08-15T04:12:00Z', actorType: 'USER', action: 'SUBSCRIPTION_UPGRADE', resourceType: 'CUSTOMER', resourceId: 'c-2', metadata: { fromPlan: 'basic-student', toPlan: 'pro' } },
  { id: 'aud-103', createdAt: '2026-08-14T22:45:00Z', actorType: 'SYSTEM', action: 'SECRET_LEAK_BLOCKED', resourceType: 'PULL_REQUEST', resourceId: 'pr-98', metadata: { file: 'packages/auth/tests/mock.spec.ts', tool: 'SECRET_SCANNER' } },
  { id: 'aud-104', createdAt: '2026-08-14T18:10:00Z', actorType: 'USER', action: 'MEMBER_INVITED', resourceType: 'ORGANIZATION', resourceId: 'org-1', metadata: { invitedEmail: 'aria@codeguard.dev', role: 'MEMBER' } },
];

// API CLIENT CLASS
class ApiClient {
  private token: string = '';

  setToken(token: string) {
    this.token = token;
  }

  async getStats(): Promise<DashboardStats> {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`);
      if (res.ok) {
        const data = await res.json();
        return {
          counts: { ...MOCK_STATS.counts, ...data.counts },
          recentReviews: data.recentReviews?.length ? data.recentReviews : MOCK_STATS.recentReviews,
          recentFindings: data.recentFindings?.length ? data.recentFindings : MOCK_STATS.recentFindings,
          activePolicies: data.activePolicies?.length ? data.activePolicies : MOCK_STATS.activePolicies,
        };
      }
    } catch {
      // fallback
    }
    return MOCK_STATS;
  }

  async switchPersona(role: DemoPersonaRole): Promise<{ token: string; user: any; plan: any }> {
    try {
      const res = await fetch(`${API_BASE}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) this.token = data.token;
        return data;
      }
    } catch {
      // fallback
    }

    const profiles: Record<DemoPersonaRole, any> = {
      student: { name: 'Alex Rivera', email: 'alex@stanford.edu', plan: { name: 'Student Developer', tier: 'FREE', priceMonthly: 0 } },
      pro: { name: 'Elena Rostova', email: 'elena@codeguard.dev', plan: { name: 'Pro Engineer', tier: 'PRO', priceMonthly: 2900 } },
      org: { name: 'Acme Payments Corp', email: 'security@acmepayments.com', plan: { name: 'Enterprise Organization', tier: 'ENTERPRISE', priceMonthly: 49900 } },
      admin: { name: 'Sarah Vance (Super Admin)', email: 'admin@codeguard.dev', plan: { name: 'Platform Admin', tier: 'ENTERPRISE', priceMonthly: 0 } },
    };

    return {
      token: `demo-token-${role}-${Date.now()}`,
      user: profiles[role],
      plan: profiles[role].plan,
    };
  }

  async runReviewSimulation(repo: string, branch: string, model: string): Promise<ReviewRunItem> {
    // Simulated live review run
    return {
      id: `rev-${Math.random().toString(36).substring(2, 9)}`,
      repositoryName: repo,
      pullRequestTitle: `Manual AI Verification on ${branch}`,
      branch,
      status: 'COMPLETED',
      verdict: 'APPROVED',
      summary: `Automated zero-trust code review completed using ${model}. AST parsed 14 files, 0 security secrets found, all branch policy rules satisfied.`,
      executionTimeMs: 1180,
      createdAt: new Date().toISOString(),
      criticalCount: 0,
      highCount: 0,
      medCount: 0,
    };
  }

  async requestBreakGlass(repoId: string, branch: string, reason: string): Promise<{ success: boolean; id: string }> {
    return {
      success: true,
      id: `bg-${Date.now()}`,
    };
  }
}

export const api = new ApiClient();
