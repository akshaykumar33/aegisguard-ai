// ============================================================================
// CodeGuard / OrgCode Core Type Definitions
// ============================================================================

// ----------------------------------------------------------------------------
// 1. Multi-Tenancy, Identities & Authorization
// ----------------------------------------------------------------------------
export type Role = 'OWNER' | 'ADMIN' | 'SECURITY_LEAD' | 'MEMBER' | 'READ_ONLY';

export type ActorType = 'DEVELOPER' | 'AI_AGENT' | 'CI_SYSTEM' | 'BOT' | 'ADMIN';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  hashedKey: string;
  actorType?: ActorType;
  expiresAt?: Date | null;
  lastUsedAt?: Date | null;
  createdAt: Date;
}

export interface TenantContext {
  organizationId: string;
  userId?: string;
  role?: Role;
  actorType?: ActorType;
  isServiceAccount?: boolean;
}

// ----------------------------------------------------------------------------
// 2. Repositories & Git Providers
// ----------------------------------------------------------------------------
export type GitProviderType = 'github' | 'gitlab' | 'bitbucket';

export interface Repository {
  id: string;
  organizationId: string;
  provider: GitProviderType;
  providerRepoId: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  cloneUrl: string;
  installationId: string;
  lastIndexedCommitSha?: string | null;
  lastIndexedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepositoryInstallation {
  id: string;
  organizationId: string;
  provider: GitProviderType;
  installationId: string;
  accountName: string;
  accountId: string;
  permissions: Record<string, string>;
  suspendedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------------------------
// 3. Branch Protection & Policy Hierarchy
// ----------------------------------------------------------------------------
export type PolicyLevel = 'ORGANIZATION' | 'REPOSITORY' | 'BRANCH' | 'DEVELOPER';

export interface BranchProtectionRule {
  pattern: string; // e.g. "main", "master", "release/*", "production"
  requirePullRequest: boolean;
  requiredApprovals: number;
  requireCodeOwners: boolean;
  requireAiReview: boolean;
  requireSecurityScan: boolean;
  requireTests: boolean;
  requireSecretScan: boolean;
  enforceAdmins: boolean;
  preventForcePush: boolean;
  preventDeletion: boolean;
  requireSignedCommits: boolean;
  requireLinearHistory: boolean;
  requiredStatusChecks: string[];
}

export interface BranchDriftReport {
  repositoryId: string;
  branch: string;
  inSync: boolean;
  driftStatus: 'IN_SYNC' | 'DRIFTED' | 'REMEDIATED';
  expected: Partial<BranchProtectionRule>;
  actual: Partial<BranchProtectionRule>;
  discrepancies: string[];
  detectedAt: Date;
  remediatedAt?: Date | null;
}

export interface DriftRemediationResult {
  repositoryId: string;
  branch: string;
  success: boolean;
  remediatedRules: string[];
  error?: string;
}

// ----------------------------------------------------------------------------
// 4. CODEOWNERS & Review Delegation
// ----------------------------------------------------------------------------
export interface CodeOwnersRule {
  pathPattern: string;
  owners: string[]; // e.g. ["@security-team", "@payments-lead"]
}

export interface CodeOwnersEvaluation {
  matchedRules: CodeOwnersRule[];
  requiredOwners: string[];
  approvedOwners: string[];
  missingOwners: string[];
  satisfied: boolean;
}

// ----------------------------------------------------------------------------
// 5. Pull Requests & Diff
// ----------------------------------------------------------------------------
export type PullRequestState = 'OPEN' | 'CLOSED' | 'MERGED';

export interface PullRequest {
  id: string;
  organizationId: string;
  repositoryId: string;
  number: number;
  title: string;
  description?: string | null;
  state: PullRequestState;
  sourceBranch: string;
  targetBranch: string;
  headSha: string;
  baseSha: string;
  authorUsername: string;
  isDraft: boolean;
  openedAt: Date;
  mergedAt?: Date | null;
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PullRequestFile {
  id: string;
  pullRequestId: string;
  filePath: string;
  oldFilePath?: string | null;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string | null;
}

// ----------------------------------------------------------------------------
// 6. Code Intelligence, Graph & Embeddings
// ----------------------------------------------------------------------------
export type SymbolKind =
  | 'FUNCTION'
  | 'CLASS'
  | 'METHOD'
  | 'INTERFACE'
  | 'VARIABLE'
  | 'TYPE_ALIAS'
  | 'ENUM'
  | 'MODULE'
  | 'ENDPOINT'
  | 'DATABASE_TABLE';

export interface CodeSymbol {
  id: string;
  organizationId: string;
  repositoryId: string;
  commitSha: string;
  filePath: string;
  name: string;
  kind: SymbolKind;
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
  signature?: string | null;
  docstring?: string | null;
  contentHash: string;
  createdAt: Date;
}

export type RelationType =
  | 'IMPORTS'
  | 'EXPORTS'
  | 'CALLS'
  | 'EXTENDS'
  | 'IMPLEMENTS'
  | 'USES'
  | 'READS'
  | 'WRITES'
  | 'REFERENCES'
  | 'TYPE_REFERENCES'
  | 'EXPOSES'
  | 'DEPENDS_ON'
  | 'DEFINED_IN'
  | 'TESTED_BY';

export interface CodeRelationship {
  id: string;
  organizationId: string;
  repositoryId: string;
  sourceSymbolId: string;
  targetSymbolId: string;
  relationType: RelationType;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CodeChunk {
  id: string;
  organizationId: string;
  repositoryId: string;
  commitSha: string;
  filePath: string;
  symbolId?: string | null;
  startLine: number;
  endLine: number;
  content: string;
  language: string;
  tokenCount: number;
  createdAt: Date;
}

export interface CodeEmbedding {
  id: string;
  chunkId: string;
  model: string;
  embedding: number[];
  createdAt: Date;
}

// ----------------------------------------------------------------------------
// 7. Review Runs, Stages & Merge Decision Gate
// ----------------------------------------------------------------------------
export type ReviewState =
  | 'QUEUED'
  | 'FETCHING'
  | 'SCANNING'
  | 'INDEXING'
  | 'ANALYZING'
  | 'VERIFYING'
  | 'POLICY_EVALUATION'
  | 'PUBLISHING'
  | 'PASSED'
  | 'BLOCKED'
  | 'FAILED'
  | 'CANCELLED';

export type StageName =
  | 'INGESTION'
  | 'SECRET_SCAN'
  | 'SAST_SCAN'
  | 'DEPENDENCY_SCAN'
  | 'GRAPH_RESOLVER'
  | 'HYBRID_RETRIEVAL'
  | 'AI_ANALYSIS'
  | 'AI_VERIFICATION'
  | 'POLICY_EVALUATION'
  | 'STATUS_PUBLISHING'
  | 'NOTIFICATION';

export type StageStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface ReviewRun {
  id: string;
  organizationId: string;
  repositoryId: string;
  pullRequestId: string;
  commitSha: string;
  state: ReviewState;
  policyOutcome?: 'ALLOW' | 'WARN' | 'BLOCK' | 'REQUIRE_APPROVAL' | null;
  summary?: string | null;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  durationMs?: number | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewStage {
  id: string;
  reviewRunId: string;
  name: StageName;
  status: StageStatus;
  startedAt?: Date | null;
  completedAt?: Date | null;
  durationMs?: number | null;
  error?: string | null;
  metadata?: Record<string, unknown> | null;
}

export type ReviewType = 'AI_REVIEW' | 'HUMAN_REVIEW';

export interface ReviewSubmission {
  id: string;
  pullRequestId: string;
  reviewerUsername: string;
  reviewerType: ActorType;
  reviewType: ReviewType;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';
  submittedAt: Date;
}

export interface MergeDecisionResult {
  branchProtected: boolean;
  requiredPR: boolean;
  aiReviewPassed: boolean;
  securityPassed: boolean;
  secretScanPassed: boolean;
  testsPassed: boolean;
  requiredApprovals: number;
  currentApprovals: number;
  codeOwnersSatisfied: boolean;
  isBreakGlassActive: boolean;
  outcome: 'MERGE_ALLOWED' | 'MERGE_BLOCKED';
  reasons: string[];
  blockingItems: string[];
}

// ----------------------------------------------------------------------------
// 8. Findings & Security Vulnerabilities
// ----------------------------------------------------------------------------
export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type FindingCategory =
  | 'SECURITY'
  | 'SECRET'
  | 'SAST'
  | 'DEPENDENCY'
  | 'ARCHITECTURE'
  | 'LOGIC'
  | 'CODE_QUALITY'
  | 'TESTS'
  | 'COMPLIANCE'
  | 'PERFORMANCE'
  | 'SENSITIVE_DATA';

export type FindingSource = 'DETERMINISTIC' | 'AI' | 'HYBRID';

export type FindingStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';

export interface Finding {
  id: string;
  organizationId: string;
  repositoryId: string;
  pullRequestId?: string | null;
  reviewRunId?: string | null;
  fingerprint: string;
  severity: FindingSeverity;
  category: FindingCategory;
  source: FindingSource;
  title: string;
  description: string;
  filePath: string;
  startLine: number;
  endLine: number;
  evidence?: string | null;
  impact?: string | null;
  recommendation?: string | null;
  suggestion?: string | null; // GitHub 1-click suggestion code replacement
  ruleId?: string | null;
  policyId?: string | null;
  confidence: number;
  blocking: boolean;
  status: FindingStatus;
  dismissedReason?: string | null;
  dismissedByUserId?: string | null;
  dismissedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecretFinding extends Finding {
  category: 'SECRET';
  secretType: string;
  detectedValueHash: string;
  maskedPreview: string;
  entropy?: number;
}

export interface DependencyFinding extends Finding {
  category: 'DEPENDENCY';
  packageName: string;
  currentVersion: string;
  vulnerableVersionRange: string;
  cveId?: string;
  fixedVersion?: string;
}

// ----------------------------------------------------------------------------
// 9. Policy Engine & Digitally Signed Policy
// ----------------------------------------------------------------------------
export type PolicyAction = 'ALLOW' | 'WARN' | 'BLOCK' | 'REQUIRE_APPROVAL';

export interface PolicyRule {
  id: string;
  policyId: string;
  name: string;
  ruleType:
    | 'SEVERITY_THRESHOLD'
    | 'SECRET_BLOCK'
    | 'SAST_BLOCK'
    | 'ARCHITECTURE_VIOLATION'
    | 'BRANCH_NAMING'
    | 'COMMIT_CONVENTION'
    | 'PROTECTED_BRANCH'
    | 'HUMAN_APPROVAL_GATE'
    | 'CUSTOM';
  condition: Record<string, unknown>;
  action: PolicyAction;
  enabled: boolean;
}

export interface Policy {
  id: string;
  organizationId: string;
  repositoryId?: string | null;
  name: string;
  description?: string | null;
  version: string;
  level: PolicyLevel;
  isDefault: boolean;
  enabled: boolean;
  rules: PolicyRule[];
  branchPolicies?: BranchProtectionRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SignedPolicy {
  policy: Policy;
  version: string;
  issuedAt: string;
  expiresAt: string;
  signature: string;
  signatureAlgorithm: 'HMAC-SHA256' | 'Ed25519' | 'RSA-SHA256';
  keyId: string;
}

export interface PolicyExecutionResult {
  policyId: string;
  outcome: PolicyAction;
  reasons: string[];
  blockingFindingIds: string[];
}

export interface EmergencyOverride {
  id: string;
  organizationId: string;
  repositoryId: string;
  branch: string;
  pullRequestId?: string | null;
  requesterId: string;
  requesterEmail: string;
  reason: string;
  approvedById?: string | null;
  approvedByEmail?: string | null;
  activeUntil: Date;
  revokedAt?: Date | null;
  createdAt: Date;
}

// ----------------------------------------------------------------------------
// 10. Distributed Queues & Job Payloads
// ----------------------------------------------------------------------------
export interface WebhookJobData {
  eventId: string;
  provider: GitProviderType;
  eventType: string;
  deliveryId: string;
  payload: Record<string, unknown>;
  receivedAt: string;
}

export interface ReviewJobData {
  organizationId: string;
  repositoryId: string;
  pullRequestId: string;
  prNumber: number;
  headSha: string;
  baseSha: string;
  installationId: string;
  isDraft: boolean;
}

export interface IndexJobData {
  organizationId: string;
  repositoryId: string;
  commitSha: string;
  isFullIndex: boolean;
  changedFiles?: string[];
}

export interface SecurityScanJobData {
  reviewRunId: string;
  organizationId: string;
  repositoryId: string;
  pullRequestId: string;
  headSha: string;
}

export interface NotificationJobData {
  organizationId: string;
  repositoryId: string;
  reviewRunId: string;
  type: 'PR_REVIEW_COMPLETED' | 'PR_BLOCKED' | 'SECRET_DETECTED' | 'DRIFT_DETECTED' | 'BREAK_GLASS_TRIGGERED';
  targetChannels?: string[];
}

// ----------------------------------------------------------------------------
// 11. Audit Logging
// ----------------------------------------------------------------------------
export type AuditAction =
  | 'ORG_CREATED'
  | 'REPO_CONNECTED'
  | 'REPO_DISCONNECTED'
  | 'POLICY_CREATED'
  | 'POLICY_UPDATED'
  | 'POLICY_DELETED'
  | 'POLICY_SYNCED_TO_CLI'
  | 'BRANCH_PROTECTION_APPLIED'
  | 'BRANCH_DRIFT_DETECTED'
  | 'BRANCH_DRIFT_REMEDIATED'
  | 'DIRECT_PUSH_BLOCKED'
  | 'PR_MERGE_EVALUATED'
  | 'EMERGENCY_BREAK_GLASS_REQUESTED'
  | 'EMERGENCY_BREAK_GLASS_APPROVED'
  | 'EMERGENCY_BREAK_GLASS_EXPIRED'
  | 'REVIEW_TRIGGERED'
  | 'FINDING_DISMISSED'
  | 'FINDING_RESOLVED'
  | 'SLACK_CONNECTED'
  | 'GITHUB_APP_INSTALLED'
  | 'USER_ROLE_CHANGED'
  | 'API_KEY_GENERATED'
  | 'API_KEY_REVOKED'
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_SUSPENDED'
  | 'CUSTOMER_REACTIVATED'
  | 'PLAN_CREATED'
  | 'PLAN_UPDATED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPGRADED'
  | 'SUBSCRIPTION_DOWNGRADED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'INVOICE_GENERATED'
  | 'PAYMENT_PROCESSED'
  | 'NOTIFICATION_BROADCAST'
  | 'SUPPORT_TICKET_CREATED'
  | 'SUPPORT_TICKET_RESOLVED'
  | 'ADMIN_IMPERSONATION_STARTED'
  | 'ADMIN_IMPERSONATION_ENDED';

export interface AuditLog {
  id: string;
  organizationId: string;
  actorId: string;
  actorEmail?: string;
  actorType: ActorType;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: Date;
}

// ----------------------------------------------------------------------------
// 12. Subscriber Management & Customer Portal Platform
// ----------------------------------------------------------------------------

export type CustomerType = 'INDIVIDUAL' | 'PROFESSIONAL' | 'ORGANIZATION';
export type CustomerStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
export type PlanTier = 'BASIC' | 'PRO' | 'ORGANIZATION';
export type EntitlementType = 'BOOLEAN' | 'LIMIT' | 'QUOTA' | 'TEXT' | 'ENUM';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
export type BillingInterval = 'MONTHLY' | 'YEARLY';
export type InvoiceStatus = 'PAID' | 'OPEN' | 'VOID' | 'UNCOLLECTIBLE' | 'REFUNDED';
export type PaymentStatus = 'SUCCEEDED' | 'PENDING' | 'FAILED' | 'REFUNDED';
export type PaymentMethodType = 'CARD' | 'UPI' | 'NETBANKING' | 'INVOICE';
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'URGENT' | 'SYSTEM' | 'BILLING' | 'SUBSCRIPTION' | 'SECURITY' | 'ANNOUNCEMENT';
export type NotificationPriority = 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory = 'TECHNICAL' | 'BILLING' | 'FEATURE_REQUEST' | 'ACCOUNT' | 'GENERAL';

export interface CustomerSegment {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  type: CustomerType;
  segmentId?: string | null;
  name: string;
  email: string;
  profession?: string | null;
  organizationId?: string | null;
  primaryUserId?: string | null;
  status: CustomerStatus;
  suspendedReason?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Feature {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  type: EntitlementType;
  defaultValueJson: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Benefit {
  id: string;
  title: string;
  description?: string | null;
  icon: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  tier: PlanTier;
  customerType: CustomerType;
  description?: string | null;
  priceMonthly: number; // in cents
  priceYearly: number;
  currency: string;
  trialPeriodDays: number;
  isActive: boolean;
  isPublic: boolean;
  displayOrder: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanWithDetails extends Plan {
  features: Array<{
    feature: Feature;
    value: any;
    isEnabled: boolean;
  }>;
  benefits: Benefit[];
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: Date | null;
  cancelledAt?: Date | null;
  pausedAt?: Date | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionWithPlan extends Subscription {
  plan: PlanWithDetails;
}

export interface CustomerEntitlements {
  customerId: string;
  planTier: PlanTier;
  features: Record<string, any>;
  limits: Record<string, number>;
  benefits: Benefit[];
  status: SubscriptionStatus;
}

export interface UsageRecord {
  id: string;
  customerId: string;
  featureCode: string;
  periodKey: string;
  quantity: number;
  limit?: number | null;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId?: string | null;
  invoiceNumber: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: InvoiceStatus;
  invoicePdfUrl?: string | null;
  dueDate?: Date | null;
  paidAt?: Date | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  customerId: string;
  invoiceId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethodType;
  provider: string;
  providerTransactionId?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  channels: string[];
  actionUrl?: string | null;
  targetAudience: {
    type: 'EVERYONE' | 'CUSTOMER_TYPE' | 'PROFESSION' | 'PLAN' | 'ORGANIZATION' | 'INDIVIDUAL';
    value?: string;
  };
  senderUserId?: string | null;
  expiresAt?: Date | null;
  createdAt: Date;
}

export interface NotificationRecipient {
  id: string;
  notificationId: string;
  userId: string;
  customerId: string;
  isRead: boolean;
  readAt?: Date | null;
  isDismissed: boolean;
  createdAt: Date;
  notification?: PlatformNotification;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  audienceType: string;
  targetFilterJson: Record<string, unknown>;
  priority: NotificationPriority;
  startDate: Date;
  endDate?: Date | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  userId: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedAdminId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderUserId: string;
  senderType: 'CUSTOMER' | 'ADMIN';
  message: string;
  attachments: Array<{ name: string; url: string; size: number }>;
  createdAt: Date;
}

export interface DocumentResource {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  requiredFeatureCode?: string | null;
  minPlanTier: PlanTier;
  isPublic: boolean;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImpersonationSession {
  id: string;
  adminUserId: string;
  targetCustomerId: string;
  targetUserId: string;
  reason: string;
  startedAt: Date;
  endedAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
}


