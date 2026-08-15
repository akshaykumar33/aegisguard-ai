export type ThemeName = 'dark' | 'stripe' | 'amoled' | 'purple' | 'emerald';
export type AccentColor = 'indigo' | 'cyan' | 'emerald' | 'violet' | 'rose' | 'amber';
export type DemoPersonaRole = 'student' | 'pro' | 'org' | 'admin';

export interface PersonaProfile {
  role: DemoPersonaRole;
  name: string;
  email: string;
  planName: string;
  tier: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE' | 'CUSTOM';
  organization?: string;
  avatarUrl: string;
}

export interface DashboardStats {
  counts: {
    organizations: number;
    repositories: number;
    pullRequests: number;
    reviews: number;
    criticalFindings: number;
    highFindings: number;
    activeModel: string;
  };
  recentReviews: ReviewRunItem[];
  recentFindings: FindingItem[];
  activePolicies: any[];
}

export interface ReviewRunItem {
  id: string;
  repositoryId?: string;
  repositoryName?: string;
  pullRequestId?: string;
  pullRequestTitle?: string;
  prNumber?: number;
  commitSha?: string;
  branch?: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  verdict: 'APPROVED' | 'CHANGES_REQUESTED' | 'BLOCKED' | 'PENDING';
  summary?: string;
  executionTimeMs?: number;
  createdAt: string;
  criticalCount?: number;
  highCount?: number;
  medCount?: number;
}

export interface FindingItem {
  id: string;
  reviewRunId?: string;
  tool: 'GEMINI_AI' | 'AST_PARSER' | 'SECRET_SCANNER' | 'CODE_GRAPH' | 'POLICY_ENGINE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  title: string;
  description: string;
  file?: string;
  lineStart?: number;
  lineEnd?: number;
  codeSnippet?: string;
  suggestedFix?: string;
  isAiVerified?: boolean;
  status?: 'ACTIVE' | 'SUPPRESSED' | 'RESOLVED';
  createdAt: string;
}

export interface UsageMeterItem {
  name: string;
  current: number;
  limit: number | string;
  percentage: number;
  isWarning: boolean;
  isExceeded: boolean;
}

export interface BenefitItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  minTier: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  amountDue: number;
  status: 'PAID' | 'DUE' | 'FAILED' | 'VOID';
  description: string;
  receiptUrl?: string;
}

export interface TeamMemberItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'SECURITY_LEAD' | 'AUDITOR';
  joinedAt: string;
  avatarUrl?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  description: string;
  category: 'SOC2' | 'ARCHITECTURE' | 'API' | 'SECURITY' | 'COMPLIANCE';
  minPlanTier: string;
  slug: string;
  updatedAt: string;
}

export interface SupportTicketItem {
  id: string;
  subject: string;
  category: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  message?: string;
}

export interface CustomerAdminItem {
  id: string;
  name: string;
  email: string;
  type: 'INDIVIDUAL' | 'PROFESSIONAL' | 'ORGANIZATION';
  activePlan?: {
    name: string;
    tier: string;
    priceMonthly: number;
  };
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  createdAt: string;
}

export interface PlanCatalogItem {
  id: string;
  name: string;
  slug: string;
  tier: string;
  priceMonthly: number;
  description: string;
  isPopular?: boolean;
  features: string[];
}

export interface AuditLogItem {
  id: string;
  createdAt: string;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}
