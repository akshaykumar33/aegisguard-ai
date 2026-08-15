import crypto from 'node:crypto';
import { db } from './client.js';
import { eq, and } from 'drizzle-orm';
import {
  organizations,
  users,
  repositories,
  policies,
  policyRules,
  memberships,
  customerSegments,
  customers,
  plans,
  features,
  benefits,
  planFeatures,
  planBenefits,
  subscriptions,
  subscriptionHistory,
  invoices,
  payments,
  usageRecords,
  notifications,
  notificationRecipients,
  announcements,
  supportTickets,
  supportMessages,
  documents,
  pullRequests,
  reviewRuns,
  reviewStages,
  reviewFindings
} from './schema/index.js';
import { logger } from '@codeguard/logger';

/** Shared credential for every seeded demo account. Local development only. */
const DEMO_PASSWORD = 'CodeGuard!2026';

/**
 * PBKDF2 hash in the `salt:derivedKey` form that @codeguard/auth verifyPassword
 * expects. Duplicated rather than imported because @codeguard/auth depends on
 * this package — importing it here would create a dependency cycle. Keep the
 * parameters below in sync with hashPassword in packages/auth/src/index.ts.
 */
function hashDemoPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export async function seedDatabase() {
  logger.info('🌱 Starting comprehensive database seeding for CodeGuard & Subscriber Platform...');

  try {
    // 1. Create Customer Segments
    let [segStudent] = await db
      .insert(customerSegments)
      .values({
        name: 'Student & Academic',
        slug: 'student-academic',
        description: 'Individual students, researchers, and learners developing locally.'
      })
      .onConflictDoNothing()
      .returning();
    if (!segStudent) [segStudent] = await db.select().from(customerSegments).where(eq(customerSegments.slug, 'student-academic')).limit(1);

    let [segPro] = await db
      .insert(customerSegments)
      .values({
        name: 'Working Professional & Solo Developer',
        slug: 'working-professional',
        description: 'Independent software engineers, freelancers, and consultants.'
      })
      .onConflictDoNothing()
      .returning();
    if (!segPro) [segPro] = await db.select().from(customerSegments).where(eq(customerSegments.slug, 'working-professional')).limit(1);

    let [segOrg] = await db
      .insert(customerSegments)
      .values({
        name: 'Enterprise & High-Growth Team',
        slug: 'enterprise-org',
        description: 'Engineering organizations requiring centralized PR governance, compliance, and multi-repo security.'
      })
      .onConflictDoNothing()
      .returning();
    if (!segOrg) [segOrg] = await db.select().from(customerSegments).where(eq(customerSegments.slug, 'enterprise-org')).limit(1);

    // 2. Define Technical Features
    const featureDefinitions = [
      { code: 'LOCAL_INDEXING', name: 'Local Code Context Indexing', type: 'BOOLEAN', defaultValueJson: true, description: 'Extract local symbols and AST from local codebases via CLI' },
      { code: 'CODE_GRAPH_RAG', name: 'Code Graph & Context Store', type: 'BOOLEAN', defaultValueJson: true, description: 'RAG retrieval with graph-based symbol relationships' },
      { code: 'LOCAL_REVIEW', name: 'Local Pre-Commit & Diff Reviews', type: 'BOOLEAN', defaultValueJson: true, description: 'Run offline checks and local code reviews' },
      { code: 'SECRET_SCANNING', name: 'Zero-Trust Secret Detection', type: 'BOOLEAN', defaultValueJson: true, description: 'Entropy and regex scanning for exposed API keys and credentials' },
      { code: 'BRANCH_STANDARDS', name: 'Branch & Commit Standards', type: 'BOOLEAN', defaultValueJson: true, description: 'Conventional commits and local branch naming governance' },
      { code: 'GIT_INTEGRATION', name: 'GitHub & GitLab Provider Sync', type: 'BOOLEAN', defaultValueJson: false, description: 'Cloud repository linking and webhook automation' },
      { code: 'AUTOMATED_PR_REVIEW', name: 'Automated Pull Request Reviews', type: 'BOOLEAN', defaultValueJson: false, description: 'Real-time PR diff analysis on every git push' },
      { code: 'AI_CODE_REVIEW', name: 'AI Deep Semantic Reviewer', type: 'BOOLEAN', defaultValueJson: false, description: 'Gemini 3.7 / LLM-powered multi-stage verification and architectural review' },
      { code: 'BRANCH_PROTECTION', name: 'Branch Protection & Gatekeeper', type: 'BOOLEAN', defaultValueJson: false, description: 'Enforce status checks and block merge on critical vulnerabilities' },
      { code: 'HUMAN_APPROVAL_FLOW', name: 'Human Approval Enforcement', type: 'BOOLEAN', defaultValueJson: false, description: 'Require security lead sign-off for policy exemptions' },
      { code: 'ORG_GOVERNANCE', name: 'Centralized Org-Wide Policies', type: 'BOOLEAN', defaultValueJson: false, description: 'Global compliance and security policies cascading across repos' },
      { code: 'TEAM_MANAGEMENT', name: 'Team & Role-Based Access Control', type: 'BOOLEAN', defaultValueJson: false, description: 'Multi-seat user provisioning and RBAC permissions' },
      { code: 'CUSTOM_POLICIES', name: 'Custom Security & Quality Rules', type: 'BOOLEAN', defaultValueJson: false, description: 'Define custom regex, SAST thresholds, and architectural bounds' },
      { code: 'AUDIT_LOGS', name: 'Immutable Audit Log Export', type: 'BOOLEAN', defaultValueJson: false, description: 'Enterprise compliance logs and exportable audit trail' },
      { code: 'API_ACCESS', name: 'REST & GraphQL API Access', type: 'BOOLEAN', defaultValueJson: false, description: 'Programmatic API tokens and CI/CD pipeline automation' },
      // Numeric Limits
      { code: 'USER_SEATS', name: 'User Seats Limit', type: 'LIMIT', defaultValueJson: 1, description: 'Maximum allowed member accounts' },
      { code: 'REPO_LIMIT', name: 'Repository Limit', type: 'LIMIT', defaultValueJson: 3, description: 'Maximum repositories managed' },
      { code: 'MONTHLY_LOCAL_REVIEWS', name: 'Monthly Local Reviews', type: 'QUOTA', defaultValueJson: 100, description: 'Quota for local CLI reviews' },
      { code: 'MONTHLY_PR_REVIEWS', name: 'Monthly Cloud PR Reviews', type: 'QUOTA', defaultValueJson: 0, description: 'Quota for PR checks' },
      { code: 'MONTHLY_AI_REVIEWS', name: 'Monthly AI Deep Reviews', type: 'QUOTA', defaultValueJson: 0, description: 'Quota for AI model reviews' },
      { code: 'STORAGE_GB', name: 'Context Storage (GB)', type: 'LIMIT', defaultValueJson: 5, description: 'Max indexed code embeddings and graph cache' }
    ];

    const insertedFeatures: Record<string, string> = {};
    for (const f of featureDefinitions) {
      let [inserted] = await db
        .insert(features)
        .values(f as any)
        .onConflictDoNothing()
        .returning();
      if (!inserted) {
        [inserted] = await db.select().from(features).where(eq(features.code, f.code)).limit(1);
      }
      if (inserted) {
        insertedFeatures[f.code] = inserted.id;
      }
    }

    // 3. Define Customer-Facing Benefits
    const benefitDefinitions = [
      { title: 'Local CLI Code Intelligence', description: 'Run offline AST parsing, symbol search, and fast local code review on your machine.', icon: 'terminal', displayOrder: 1 },
      { title: 'Code Graph & Context Store', description: 'Deep dependency graphs and vector retrieval for instant symbol navigation.', icon: 'git-branch', displayOrder: 2 },
      { title: 'Zero-Trust Secret Detection', description: 'Prevent accidental leaks of AWS, Stripe, GitHub, and private keys before commit.', icon: 'shield-check', displayOrder: 3 },
      { title: 'GitHub & GitLab PR Integration', description: 'Automatic review comments and status checks posted directly to your pull requests.', icon: 'github', displayOrder: 4 },
      { title: 'Gemini 3.7 AI Code Reviewer', description: 'Automated deep architecture analysis, hallucination verification, and auto-fix diffs.', icon: 'sparkles', displayOrder: 5 },
      { title: 'Zero-Bypass Branch Protection', description: 'Block pull request merges until all blocking security vulnerabilities are resolved.', icon: 'lock', displayOrder: 6 },
      { title: 'Centralized Multi-Repo Governance', description: 'Define policies once and enforce them automatically across all team repositories.', icon: 'layers', displayOrder: 7 },
      { title: 'Team & Seat Management', description: 'Manage developer seats, assign roles (Owner, Admin, Member, Read-Only), and manage permissions.', icon: 'users', displayOrder: 8 },
      { title: 'Immutable Enterprise Audit Logs', description: 'Comprehensive audit trail for every review outcome, policy change, and user action.', icon: 'file-text', displayOrder: 9 },
      { title: 'Priority 24/7 Dedicated Support', description: 'Direct access to CodeGuard security architects and sub-hour SLA response.', icon: 'headphones', displayOrder: 10 }
    ];

    const insertedBenefits: Record<string, string> = {};
    for (const b of benefitDefinitions) {
      const [inserted] = await db
        .insert(benefits)
        .values(b)
        .onConflictDoNothing()
        .returning();
      if (inserted) {
        insertedBenefits[b.title] = inserted.id;
      }
    }

    // 4. Create the 3 Core Plans: Basic / Student, Pro, Organization
    // Tier 1: Basic / Student Plan
    let [basicPlan] = await db
      .insert(plans)
      .values({
        name: 'Basic / Student Plan',
        slug: 'basic-student',
        tier: 'BASIC',
        customerType: 'INDIVIDUAL',
        description: 'Local CLI intelligence, offline AST parsing, code graph, and local secret detection for solo developers and students.',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'USD',
        trialPeriodDays: 0,
        isActive: true,
        isPublic: true,
        displayOrder: 1,
        metadata: { badge: 'Free Forever', recommendedFor: 'Students & Solo Learners' }
      })
      .onConflictDoNothing()
      .returning();
    if (!basicPlan) [basicPlan] = await db.select().from(plans).where(eq(plans.slug, 'basic-student')).limit(1);

    // Tier 2: Pro Plan
    let [proPlan] = await db
      .insert(plans)
      .values({
        name: 'Pro Plan',
        slug: 'pro',
        tier: 'PRO',
        customerType: 'PROFESSIONAL',
        description: 'Advanced AI code reviews and continuous GitHub/GitLab PR governance for professional developers.',
        priceMonthly: 2900, // $29.00
        priceYearly: 29000, // $290.00 / yr
        currency: 'USD',
        trialPeriodDays: 14,
        isActive: true,
        isPublic: true,
        displayOrder: 2,
        metadata: { badge: 'Most Popular', recommendedFor: 'Senior Developers & Freelancers' }
      })
      .onConflictDoNothing()
      .returning();
    if (!proPlan) [proPlan] = await db.select().from(plans).where(eq(plans.slug, 'pro')).limit(1);

    // Tier 3: Organization / Enterprise Plan
    let [orgPlan] = await db
      .insert(plans)
      .values({
        name: 'Organization / Enterprise',
        slug: 'enterprise',
        tier: 'ORGANIZATION',
        customerType: 'ORGANIZATION',
        description: 'Enterprise-grade code security, team governance, CODEOWNERS enforcement, and scalable usage.',
        priceMonthly: 19900, // $199.00
        priceYearly: 199000, // $1990.00 / yr
        currency: 'USD',
        trialPeriodDays: 30,
        isActive: true,
        isPublic: true,
        displayOrder: 3,
        metadata: { badge: 'Enterprise Ready', recommendedFor: 'Engineering Orgs & Security Teams' }
      })
      .onConflictDoNothing()
      .returning();
    if (!orgPlan) [orgPlan] = await db.select().from(plans).where(eq(plans.slug, 'enterprise')).limit(1);

    // 5. Attach Features to Plans
    // Helper to wire plan features if ids exist
    const attachPlanFeatures = async (planId: string, featuresMap: Record<string, any>) => {
      for (const [code, val] of Object.entries(featuresMap)) {
        const featId = insertedFeatures[code];
        if (featId) {
          await db
            .insert(planFeatures)
            .values({
              planId,
              featureId: featId,
              valueJson: val,
              isEnabled: Boolean(val)
            })
            .onConflictDoNothing();
        }
      }
    };

    if (basicPlan) {
      await attachPlanFeatures(basicPlan.id, {
        LOCAL_INDEXING: true,
        CODE_GRAPH_RAG: true,
        LOCAL_REVIEW: true,
        SECRET_SCANNING: true,
        BRANCH_STANDARDS: true,
        GIT_INTEGRATION: false,
        AUTOMATED_PR_REVIEW: false,
        AI_CODE_REVIEW: false,
        BRANCH_PROTECTION: false,
        HUMAN_APPROVAL_FLOW: false,
        ORG_GOVERNANCE: false,
        TEAM_MANAGEMENT: false,
        CUSTOM_POLICIES: false,
        AUDIT_LOGS: false,
        API_ACCESS: false,
        USER_SEATS: 1,
        REPO_LIMIT: 3,
        MONTHLY_LOCAL_REVIEWS: 100,
        MONTHLY_PR_REVIEWS: 0,
        MONTHLY_AI_REVIEWS: 0,
        STORAGE_GB: 5
      });
    }

    if (proPlan) {
      await attachPlanFeatures(proPlan.id, {
        LOCAL_INDEXING: true,
        CODE_GRAPH_RAG: true,
        LOCAL_REVIEW: true,
        SECRET_SCANNING: true,
        BRANCH_STANDARDS: true,
        GIT_INTEGRATION: true,
        AUTOMATED_PR_REVIEW: true,
        AI_CODE_REVIEW: true,
        BRANCH_PROTECTION: true,
        HUMAN_APPROVAL_FLOW: true,
        ORG_GOVERNANCE: false,
        TEAM_MANAGEMENT: false,
        CUSTOM_POLICIES: true,
        AUDIT_LOGS: true,
        API_ACCESS: true,
        USER_SEATS: 1,
        REPO_LIMIT: 10,
        MONTHLY_LOCAL_REVIEWS: 1000,
        MONTHLY_PR_REVIEWS: 100,
        MONTHLY_AI_REVIEWS: 500,
        STORAGE_GB: 50
      });
    }

    if (orgPlan) {
      await attachPlanFeatures(orgPlan.id, {
        LOCAL_INDEXING: true,
        CODE_GRAPH_RAG: true,
        LOCAL_REVIEW: true,
        SECRET_SCANNING: true,
        BRANCH_STANDARDS: true,
        GIT_INTEGRATION: true,
        AUTOMATED_PR_REVIEW: true,
        AI_CODE_REVIEW: true,
        BRANCH_PROTECTION: true,
        HUMAN_APPROVAL_FLOW: true,
        ORG_GOVERNANCE: true,
        TEAM_MANAGEMENT: true,
        CUSTOM_POLICIES: true,
        AUDIT_LOGS: true,
        API_ACCESS: true,
        USER_SEATS: 50,
        REPO_LIMIT: 50,
        MONTHLY_LOCAL_REVIEWS: 10000,
        MONTHLY_PR_REVIEWS: 2000,
        MONTHLY_AI_REVIEWS: 5000,
        STORAGE_GB: 500
      });
    }

    // 6. Attach Benefits to Plans
    const attachPlanBenefits = async (planId: string, titles: string[]) => {
      let order = 1;
      for (const t of titles) {
        const benId = insertedBenefits[t];
        if (benId) {
          await db
            .insert(planBenefits)
            .values({
              planId,
              benefitId: benId,
              displayOrder: order++
            })
            .onConflictDoNothing();
        }
      }
    };

    if (basicPlan) {
      await attachPlanBenefits(basicPlan.id, [
        'Local CLI Code Intelligence',
        'Code Graph & Context Store',
        'Zero-Trust Secret Detection'
      ]);
    }

    if (proPlan) {
      await attachPlanBenefits(proPlan.id, [
        'Local CLI Code Intelligence',
        'Code Graph & Context Store',
        'Zero-Trust Secret Detection',
        'GitHub & GitLab PR Integration',
        'Gemini 3.7 AI Code Reviewer',
        'Zero-Bypass Branch Protection'
      ]);
    }

    if (orgPlan) {
      await attachPlanBenefits(orgPlan.id, [
        'Local CLI Code Intelligence',
        'Code Graph & Context Store',
        'Zero-Trust Secret Detection',
        'GitHub & GitLab PR Integration',
        'Gemini 3.7 AI Code Reviewer',
        'Zero-Bypass Branch Protection',
        'Centralized Multi-Repo Governance',
        'Team & Seat Management',
        'Immutable Enterprise Audit Logs',
        'Priority 24/7 Dedicated Support'
      ]);
    }

    // 7. Seed Demo Users
    //
    // Every demo account shares DEMO_PASSWORD so /auth/login works out of the box
    // after seeding. Only superadmin@codeguard.dev carries isPlatformAdmin.
    const demoPasswordHash = await hashDemoPassword(DEMO_PASSWORD);

    let [superAdminUser] = await db
      .insert(users)
      .values({
        email: 'superadmin@codeguard.dev',
        name: 'Sarah Connor (Super Admin)',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
        passwordHash: demoPasswordHash,
        isPlatformAdmin: true
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { isPlatformAdmin: true, name: 'Sarah Connor (Super Admin)' }
      })
      .returning();

    let [studentUser] = await db
      .insert(users)
      .values({
        email: 'student@codeguard.dev',
        name: 'Aarav Sharma (Student Dev)',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
        passwordHash: demoPasswordHash
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { name: 'Aarav Sharma (Student Dev)', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' }
      })
      .returning();

    let [proUser] = await db
      .insert(users)
      .values({
        email: 'pro@codeguard.dev',
        name: 'Elena Rostova (Staff Engineer)',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956',
        passwordHash: demoPasswordHash
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { name: 'Elena Rostova (Staff Engineer)', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956' }
      })
      .returning();

    let [orgOwnerUser] = await db
      .insert(users)
      .values({
        email: 'admin@acmepayments.com',
        name: 'Alex Rivera (Security Lead)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        passwordHash: demoPasswordHash
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { name: 'Alex Rivera (Security Lead)', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' }
      })
      .returning();

    let [orgMemberUser] = await db
      .insert(users)
      .values({
        email: 'dev1@acmepayments.com',
        name: 'Jordan Lee (Frontend Dev)',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        passwordHash: demoPasswordHash
      })
      .onConflictDoNothing()
      .returning();
    if (!orgMemberUser) {
      [orgMemberUser] = await db.select().from(users).where(eq(users.email, 'dev1@acmepayments.com')).limit(1);
    }

    // 8. Seed Demo Organization
    let [demoOrg] = await db
      .insert(organizations)
      .values({
        name: 'Acme Payments Corp',
        slug: 'acme-corp',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe'
      })
      .onConflictDoNothing()
      .returning();
    if (!demoOrg) {
      [demoOrg] = await db.select().from(organizations).where(eq(organizations.slug, 'acme-corp')).limit(1);
    }

    // Seed distinct team members
    const teamSeeds = [
      { name: 'Alex Rivera', email: 'admin@acmepayments.com', role: 'OWNER', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { name: 'Elena Rostova', email: 'pro@codeguard.dev', role: 'SECURITY_LEAD', avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
      { name: 'Marcus Vance', email: 'marcus.vance@acmepayments.com', role: 'ADMIN', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { name: 'Sarah Chen', email: 'sarah.chen@acmepayments.com', role: 'ADMIN', avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
      { name: 'Priya Patel', email: 'priya.patel@acmepayments.com', role: 'MEMBER', avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80' },
      { name: 'David Kim', email: 'david.kim@acmepayments.com', role: 'MEMBER', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
      { name: 'Jordan Lee', email: 'dev1@acmepayments.com', role: 'MEMBER', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
      { name: 'Rachel Adams', email: 'rachel.adams@acmepayments.com', role: 'SECURITY_LEAD', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
      { name: 'Tomas Novak', email: 'tomas.novak@acmepayments.com', role: 'MEMBER', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
      { name: 'Amina Bello', email: 'amina.bello@acmepayments.com', role: 'MEMBER', avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80' },
      { name: 'Carlos Mendez', email: 'carlos.mendez@acmepayments.com', role: 'MEMBER', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
      { name: 'Emily Zhang', email: 'emily.zhang@acmepayments.com', role: 'MEMBER', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
      { name: 'Liam O\'Connor', email: 'liam.oconnor@acmepayments.com', role: 'MEMBER', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
      { name: 'Sofia Rossi', email: 'sofia.rossi@acmepayments.com', role: 'MEMBER', avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80' },
      { name: 'Aarav Sharma', email: 'student@codeguard.dev', role: 'MEMBER', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { name: 'Vikram Seth', email: 'superadmin@codeguard.dev', role: 'ADMIN', avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' }
    ];

    if (demoOrg) {
      for (const t of teamSeeds) {
        let [u] = await db.select().from(users).where(eq(users.email, t.email)).limit(1);
        if (!u) {
          [u] = await db.insert(users).values({
            email: t.email,
            passwordHash: await hashDemoPassword(DEMO_PASSWORD),
            name: t.name,
            avatarUrl: t.avatarUrl,
            isPlatformAdmin: t.email === 'superadmin@codeguard.dev'
          }).returning();
        }

        if (u) {
          const [m] = await db
            .select()
            .from(memberships)
            .where(and(eq(memberships.organizationId, demoOrg.id), eq(memberships.userId, u.id)))
            .limit(1);

          if (!m) {
            await db.insert(memberships).values({
              organizationId: demoOrg.id,
              userId: u.id,
              role: t.role as any
            });
          }
        }
      }
    }

    // 9. Seed Demo Customers (Student, Pro, Org)
    let studentCustomer = null;
    if (studentUser && segStudent) {
      [studentCustomer] = await db
        .insert(customers)
        .values({
          type: 'INDIVIDUAL',
          segmentId: segStudent.id,
          name: 'Aarav Sharma',
          email: 'student@codeguard.dev',
          profession: 'Student & Researcher',
          primaryUserId: studentUser.id,
          status: 'ACTIVE'
        })
        .onConflictDoNothing()
        .returning();
      if (!studentCustomer) {
        [studentCustomer] = await db.select().from(customers).where(eq(customers.email, 'student@codeguard.dev')).limit(1);
      }
    }

    let proCustomer = null;
    if (proUser && segPro) {
      [proCustomer] = await db
        .insert(customers)
        .values({
          type: 'PROFESSIONAL',
          segmentId: segPro.id,
          name: 'Elena Rostova',
          email: 'pro@codeguard.dev',
          profession: 'Freelance & Staff Engineer',
          primaryUserId: proUser.id,
          status: 'ACTIVE'
        })
        .onConflictDoNothing()
        .returning();
      if (!proCustomer) {
        [proCustomer] = await db.select().from(customers).where(eq(customers.email, 'pro@codeguard.dev')).limit(1);
      }
    }

    let orgCustomer = null;
    if (demoOrg && orgOwnerUser && segOrg) {
      [orgCustomer] = await db
        .insert(customers)
        .values({
          type: 'ORGANIZATION',
          segmentId: segOrg.id,
          name: 'Acme Payments Corp',
          email: 'admin@acmepayments.com',
          profession: 'Fintech Enterprise',
          organizationId: demoOrg.id,
          primaryUserId: orgOwnerUser.id,
          status: 'ACTIVE'
        })
        .onConflictDoNothing()
        .returning();
      if (!orgCustomer) {
        [orgCustomer] = await db.select().from(customers).where(eq(customers.email, 'admin@acmepayments.com')).limit(1);
      }
    }

    let superAdminCustomer = null;
    if (superAdminUser && segOrg) {
      [superAdminCustomer] = await db
        .insert(customers)
        .values({
          type: 'ORGANIZATION',
          segmentId: segOrg.id,
          name: 'CodeGuard HQ (Platform Super Admin)',
          email: 'superadmin@codeguard.dev',
          profession: 'Platform Operations & Security',
          organizationId: demoOrg?.id,
          primaryUserId: superAdminUser.id,
          status: 'ACTIVE'
        })
        .onConflictDoNothing()
        .returning();
      if (!superAdminCustomer) {
        [superAdminCustomer] = await db.select().from(customers).where(eq(customers.email, 'superadmin@codeguard.dev')).limit(1);
      }
    }

    // 10. Seed Subscriptions
    const oneYearAhead = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const oneMonthAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (superAdminCustomer && orgPlan) {
      let [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.customerId, superAdminCustomer.id))
        .limit(1);

      if (!sub) {
        [sub] = await db.insert(subscriptions).values({
          customerId: superAdminCustomer.id,
          planId: orgPlan.id,
          status: 'ACTIVE',
          billingInterval: 'YEARLY',
          currentPeriodStart: new Date(),
          currentPeriodEnd: oneYearAhead
        }).returning();

        if (sub) {
          await db.insert(subscriptionHistory).values({
            subscriptionId: sub.id,
            customerId: superAdminCustomer.id,
            planId: orgPlan.id,
            action: 'CREATED',
            reason: 'Platform super admin provisioned'
          }).onConflictDoNothing();
        }
      }

      await db.insert(usageRecords).values([
        { customerId: superAdminCustomer.id, featureCode: 'MONTHLY_PR_REVIEWS', periodKey: '2026-08', quantity: 142, limit: 2000 },
        { customerId: superAdminCustomer.id, featureCode: 'MONTHLY_AI_REVIEWS', periodKey: '2026-08', quantity: 380, limit: 5000 },
        { customerId: superAdminCustomer.id, featureCode: 'REPO_LIMIT', periodKey: 'lifetime', quantity: 18, limit: 50 },
        { customerId: superAdminCustomer.id, featureCode: 'STORAGE_GB', periodKey: 'lifetime', quantity: 45, limit: 500 }
      ]).onConflictDoNothing();
    }

    if (studentCustomer && basicPlan) {
      let [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.customerId, studentCustomer.id))
        .limit(1);

      if (!sub) {
        [sub] = await db.insert(subscriptions).values({
          customerId: studentCustomer.id,
          planId: basicPlan.id,
          status: 'ACTIVE',
          billingInterval: 'MONTHLY',
          currentPeriodStart: new Date(),
          currentPeriodEnd: oneYearAhead
        }).returning();

        if (sub) {
          await db.insert(subscriptionHistory).values({
            subscriptionId: sub.id,
            customerId: studentCustomer.id,
            planId: basicPlan.id,
            action: 'CREATED',
            reason: 'Initial student registration'
          }).onConflictDoNothing();
        }
      }

      // Usage records for student
      await db.insert(usageRecords).values([
        { customerId: studentCustomer.id, featureCode: 'MONTHLY_LOCAL_REVIEWS', periodKey: '2026-08', quantity: 28, limit: 100 },
        { customerId: studentCustomer.id, featureCode: 'REPO_LIMIT', periodKey: 'lifetime', quantity: 2, limit: 3 },
        { customerId: studentCustomer.id, featureCode: 'STORAGE_GB', periodKey: 'lifetime', quantity: 1, limit: 5 }
      ]).onConflictDoNothing();
    }

    if (proCustomer && proPlan) {
      let [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.customerId, proCustomer.id))
        .limit(1);

      if (!sub) {
        [sub] = await db.insert(subscriptions).values({
          customerId: proCustomer.id,
          planId: proPlan.id,
          status: 'ACTIVE',
          billingInterval: 'MONTHLY',
          currentPeriodStart: new Date(),
          currentPeriodEnd: oneMonthAhead
        }).returning();

        if (sub) {
          await db.insert(subscriptionHistory).values({
            subscriptionId: sub.id,
            customerId: proCustomer.id,
            planId: proPlan.id,
            action: 'CREATED',
            reason: 'Subscribed to Pro Plan'
          }).onConflictDoNothing();
        }
      }

      // Invoices for pro
      let [inv] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, 'INV-PRO-2026-001'))
        .limit(1);

      if (!inv && sub) {
        [inv] = await db.insert(invoices).values({
          customerId: proCustomer.id,
          subscriptionId: sub.id,
          invoiceNumber: 'INV-PRO-2026-001',
          amountDue: 2900,
          amountPaid: 2900,
          currency: 'USD',
          status: 'PAID',
          paidAt: new Date()
        }).returning();

        if (inv) {
          await db.insert(payments).values({
            customerId: proCustomer.id,
            invoiceId: inv.id,
            amount: 2900,
            currency: 'USD',
            status: 'SUCCEEDED',
            paymentMethod: 'CARD',
            provider: 'MOCK',
            providerTransactionId: 'txn_mock_pro_8892'
          }).onConflictDoNothing();
        }
      }

      // Usage records for pro
      await db.insert(usageRecords).values([
        { customerId: proCustomer.id, featureCode: 'MONTHLY_PR_REVIEWS', periodKey: '2026-08', quantity: 42, limit: 100 },
        { customerId: proCustomer.id, featureCode: 'MONTHLY_AI_REVIEWS', periodKey: '2026-08', quantity: 180, limit: 500 },
        { customerId: proCustomer.id, featureCode: 'REPO_LIMIT', periodKey: 'lifetime', quantity: 6, limit: 10 },
        { customerId: proCustomer.id, featureCode: 'STORAGE_GB', periodKey: 'lifetime', quantity: 18, limit: 50 }
      ]).onConflictDoNothing();
    }

    if (orgCustomer && orgPlan) {
      let [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.customerId, orgCustomer.id))
        .limit(1);

      if (!sub) {
        [sub] = await db.insert(subscriptions).values({
          customerId: orgCustomer.id,
          planId: orgPlan.id,
          status: 'ACTIVE',
          billingInterval: 'YEARLY',
          currentPeriodStart: new Date(),
          currentPeriodEnd: oneYearAhead
        }).returning();

        if (sub) {
          await db.insert(subscriptionHistory).values({
            subscriptionId: sub.id,
            customerId: orgCustomer.id,
            planId: orgPlan.id,
            action: 'CREATED',
            reason: 'Enterprise contract activated'
          }).onConflictDoNothing();
        }
      }

      // Invoices for org
      let [inv] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, 'INV-ENT-2026-001'))
        .limit(1);

      if (!inv && sub) {
        [inv] = await db.insert(invoices).values({
          customerId: orgCustomer.id,
          subscriptionId: sub.id,
          invoiceNumber: 'INV-ENT-2026-001',
          amountDue: 199000,
          amountPaid: 199000,
          currency: 'USD',
          status: 'PAID',
          paidAt: new Date()
        }).returning();

        if (inv) {
          await db.insert(payments).values({
            customerId: orgCustomer.id,
            invoiceId: inv.id,
            amount: 199000,
            currency: 'USD',
            status: 'SUCCEEDED',
            paymentMethod: 'INVOICE',
            provider: 'MOCK',
            providerTransactionId: 'txn_mock_org_9921'
          }).onConflictDoNothing();
        }
      }

      // Usage records for org
      await db.insert(usageRecords).values([
        { customerId: orgCustomer.id, featureCode: 'USER_SEATS', periodKey: 'lifetime', quantity: 24, limit: 50 },
        { customerId: orgCustomer.id, featureCode: 'REPO_LIMIT', periodKey: 'lifetime', quantity: 14, limit: 50 },
        { customerId: orgCustomer.id, featureCode: 'MONTHLY_PR_REVIEWS', periodKey: '2026-08', quantity: 620, limit: 2000 },
        { customerId: orgCustomer.id, featureCode: 'MONTHLY_AI_REVIEWS', periodKey: '2026-08', quantity: 1450, limit: 5000 },
        { customerId: orgCustomer.id, featureCode: 'STORAGE_GB', periodKey: 'lifetime', quantity: 142, limit: 500 }
      ]).onConflictDoNothing();
    }

    // 11. Seed System Notifications & Announcements
    let [welcomeNotif] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.title, 'Welcome to CodeGuard AI'))
      .limit(1);

    if (!welcomeNotif) {
      [welcomeNotif] = await db.insert(notifications).values({
        title: 'Welcome to CodeGuard AI',
        message: 'Your CodeGuard platform is ready. Install the CLI or connect your GitHub repositories to start automated PR reviews.',
        type: 'INFO',
        priority: 'NORMAL',
        channelsJson: ['IN_APP', 'EMAIL'],
        targetAudienceJson: { type: 'EVERYONE' }
      }).returning();
    }

    if (welcomeNotif && proUser && proCustomer) {
      await db.insert(notificationRecipients).values({
        notificationId: welcomeNotif.id,
        userId: proUser.id,
        customerId: proCustomer.id,
        isRead: false
      }).onConflictDoNothing();
    }

    if (welcomeNotif && studentUser && studentCustomer) {
      await db.insert(notificationRecipients).values({
        notificationId: welcomeNotif.id,
        userId: studentUser.id,
        customerId: studentCustomer.id,
        isRead: false
      }).onConflictDoNothing();
    }

    // Platform Announcement
    await db.insert(announcements).values({
      title: '🚀 CodeGuard 2.0 Released: Gemini 3.7 Flash AI Reviewer & Real-time AST Graph',
      description: 'We have updated our core review engine with Google Gemini 3.7 Flash for sub-second PR analysis and zero false-positive security filtering.',
      audienceType: 'EVERYONE',
      priority: 'HIGH',
      ctaText: 'Explore Features',
      ctaUrl: '/app/features',
      status: 'PUBLISHED'
    }).onConflictDoNothing();

    // 12. Seed Support Ticket
    if (orgCustomer && orgOwnerUser) {
      let [ticket] = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.ticketNumber, 'TICK-8021'))
        .limit(1);

      if (!ticket) {
        [ticket] = await db.insert(supportTickets).values({
          ticketNumber: 'TICK-8021',
          customerId: orgCustomer.id,
          userId: orgOwnerUser.id,
          subject: 'Inquiry on Custom Enterprise SSO & SCIM Provisioning',
          description: 'We are looking to connect our corporate Okta directory with SCIM automated seat provisioning.',
          category: 'ACCOUNT',
          priority: 'HIGH',
          status: 'IN_PROGRESS'
        }).returning();

        if (ticket) {
          await db.insert(supportMessages).values([
            {
              ticketId: ticket.id,
              senderUserId: orgOwnerUser.id,
              senderType: 'CUSTOMER',
              message: 'Hello, could you provide the technical specs for Okta SAML 2.0 integration?'
            },
            {
              ticketId: ticket.id,
              senderUserId: superAdminUser ? superAdminUser.id : orgOwnerUser.id,
              senderType: 'ADMIN',
              message: 'Hi Alex, our enterprise team supports SAML 2.0 and OIDC. I have attached our Okta Configuration Guide.'
            }
          ]).onConflictDoNothing();
        }
      }
    }

    // 13. Seed Resources / Documents
    await db.insert(documents).values([
      {
        title: 'CodeGuard CLI Quickstart & Local Setup Guide',
        description: 'Step-by-step instructions to initialize local AST indexing, secret detection, and pre-commit checks.',
        category: 'GUIDE',
        fileUrl: 'https://docs.codeguard.dev/guides/cli-quickstart.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
        minPlanTier: 'BASIC',
        isPublic: true,
        downloadCount: 412
      },
      {
        title: 'SOC2 Type II & HIPAA Compliance Architecture Whitepaper',
        description: 'Comprehensive analysis of zero-retention AI prompts, data encryption at rest/transit, and tenant isolation.',
        category: 'COMPLIANCE',
        fileUrl: 'https://docs.codeguard.dev/compliance/soc2-hipaa-whitepaper.pdf',
        fileSize: 3145728,
        mimeType: 'application/pdf',
        minPlanTier: 'ORGANIZATION',
        isPublic: false,
        downloadCount: 89
      },
      {
        title: 'Zero-Trust PR Review Policy Blueprint (YAML Template)',
        description: 'Production-ready policy configuration rules for financial services and healthcare repos.',
        category: 'TEMPLATE',
        fileUrl: 'https://docs.codeguard.dev/templates/zero-trust-policies.yaml',
        fileSize: 45056,
        mimeType: 'text/yaml',
        minPlanTier: 'PRO',
        isPublic: false,
        downloadCount: 230
      }
    ]).onConflictDoNothing();

    // 14. Demo Repositories, Policies, PRs & Review Runs
    if (demoOrg) {
      // Connect Pro and Student demo users to demoOrg memberships so they have tenant access
      if (proUser) {
        await db.insert(memberships).values({
          organizationId: demoOrg.id,
          userId: proUser.id,
          role: 'ADMIN'
        }).onConflictDoNothing();
      }
      if (studentUser) {
        await db.insert(memberships).values({
          organizationId: demoOrg.id,
          userId: studentUser.id,
          role: 'MEMBER'
        }).onConflictDoNothing();
      }

      // Repositories
      const repoSeeds = [
        { name: 'payments-service', fullName: 'acme/payments-service', defaultBranch: 'main' },
        { name: 'auth-gateway', fullName: 'acme/auth-gateway', defaultBranch: 'main' },
        { name: 'customer-portal', fullName: 'acme/customer-portal', defaultBranch: 'main' },
        { name: 'notification-worker', fullName: 'acme/notification-worker', defaultBranch: 'main' },
        { name: 'billing-engine', fullName: 'acme/billing-engine', defaultBranch: 'main' },
        { name: 'sast-analyzer', fullName: 'acme/sast-analyzer', defaultBranch: 'main' },
        { name: 'ast-parser', fullName: 'acme/ast-parser', defaultBranch: 'main' },
        { name: 'gemini-agent', fullName: 'acme/gemini-agent', defaultBranch: 'main' },
        { name: 'api-gateway', fullName: 'acme/api-gateway', defaultBranch: 'main' },
        { name: 'risk-engine', fullName: 'acme/risk-engine', defaultBranch: 'main' },
        { name: 'compliance-service', fullName: 'acme/compliance-service', defaultBranch: 'main' },
        { name: 'event-stream', fullName: 'acme/event-stream', defaultBranch: 'main' },
        { name: 'session-manager', fullName: 'acme/session-manager', defaultBranch: 'main' },
        { name: 'metrics-collector', fullName: 'acme/metrics-collector', defaultBranch: 'main' },
        { name: 'policy-enforcer', fullName: 'acme/policy-enforcer', defaultBranch: 'main' },
        { name: 'secret-vault', fullName: 'acme/secret-vault', defaultBranch: 'main' },
        { name: 'cache-proxy', fullName: 'acme/cache-proxy', defaultBranch: 'main' },
        { name: 'audit-dispatcher', fullName: 'acme/audit-dispatcher', defaultBranch: 'main' },
        { name: 'search-indexer', fullName: 'acme/search-indexer', defaultBranch: 'main' },
        { name: 'edge-router', fullName: 'acme/edge-router', defaultBranch: 'main' },
        { name: 'webhook-delivery', fullName: 'acme/webhook-delivery', defaultBranch: 'main' },
        { name: 'rate-limiter', fullName: 'acme/rate-limiter', defaultBranch: 'main' },
        { name: 'user-directory', fullName: 'acme/user-directory', defaultBranch: 'main' },
        { name: 'pricing-calculator', fullName: 'acme/pricing-calculator', defaultBranch: 'main' },
        { name: 'invoice-renderer', fullName: 'acme/invoice-renderer', defaultBranch: 'main' }
      ];

      for (let i = 0; i < repoSeeds.length; i++) {
        const r = repoSeeds[i];
        const [existing] = await db
          .select()
          .from(repositories)
          .where(and(eq(repositories.organizationId, demoOrg.id), eq(repositories.fullName, r.fullName)))
          .limit(1);

        if (!existing) {
          await db.insert(repositories).values({
            organizationId: demoOrg.id,
            provider: 'github',
            providerRepoId: `876543${10 + i}`,
            name: r.name,
            fullName: r.fullName,
            private: true,
            defaultBranch: r.defaultBranch,
            cloneUrl: `https://github.com/acme-corp/${r.name}.git`,
            installationId: '12345678'
          });
        }
      }

      let [activeRepo] = await db
        .select()
        .from(repositories)
        .where(and(eq(repositories.organizationId, demoOrg.id), eq(repositories.name, 'payments-service')))
        .limit(1);

      if (activeRepo) {
        const [secPolicy] = await db
          .insert(policies)
          .values({
            organizationId: demoOrg.id,
            repositoryId: activeRepo.id,
            name: 'Default Zero-Trust Security Policy',
            description: 'Block merges on exposed secrets, critical SAST vulnerabilities, and architectural layer breaches.',
            isDefault: true,
            enabled: true
          })
          .onConflictDoNothing()
          .returning();

        let activePolicy = secPolicy;
        if (!activePolicy) {
          [activePolicy] = await db.select().from(policies).where(eq(policies.repositoryId, activeRepo.id)).limit(1);
        }

        if (activePolicy) {
          await db.insert(policyRules).values([
            {
              policyId: activePolicy.id,
              name: 'Block on Detected Secrets',
              ruleType: 'SECRET_BLOCK',
              condition: { blockOnAllSecrets: true },
              action: 'BLOCK',
              enabled: true
            },
            {
              policyId: activePolicy.id,
              name: 'Block on Critical Severity Vulnerabilities',
              ruleType: 'SEVERITY_THRESHOLD',
              condition: { minSeverityToBlock: 'CRITICAL' },
              action: 'BLOCK',
              enabled: true
            },
            {
              policyId: activePolicy.id,
              name: 'Warn on High Severity Issues',
              ruleType: 'SEVERITY_THRESHOLD',
              condition: { minSeverityToWarn: 'HIGH' },
              action: 'WARN',
              enabled: true
            }
          ]).onConflictDoNothing();
        }

        // Seed Sample Pull Requests
        let [pr142] = await db
          .select()
          .from(pullRequests)
          .where(eq(pullRequests.number, 142))
          .limit(1);

        if (!pr142) {
          [pr142] = await db.insert(pullRequests).values({
            organizationId: demoOrg.id,
            repositoryId: activeRepo.id,
            number: 142,
            title: 'feat: add idempotent charge endpoint and HMAC signature validation',
            description: 'Implements Stripe-compatible idempotency keys and constant-time HMAC verification in billing webhook processor.',
            state: 'OPEN',
            sourceBranch: 'feature/idempotent-charges',
            targetBranch: 'main',
            headSha: '9a8f21bc4e5781a93b4510cd294812fa91823719',
            baseSha: '03c477e5d891b29a471908234671923058912304',
            authorUsername: 'elena-rostova',
            isDraft: false
          }).returning();
        }

        let [pr138] = await db
          .select()
          .from(pullRequests)
          .where(eq(pullRequests.number, 138))
          .limit(1);

        if (!pr138) {
          [pr138] = await db.insert(pullRequests).values({
            organizationId: demoOrg.id,
            repositoryId: activeRepo.id,
            number: 138,
            title: 'fix(auth): sanitize JWT token claims & Shannon entropy checks',
            description: 'Strengthens zero-trust token decoding and prevents leaking test tokens in log streams.',
            state: 'MERGED',
            sourceBranch: 'fix/token-entropy-guard',
            targetBranch: 'main',
            headSha: 'c81923b0a9481237192837192837192837192837',
            baseSha: '03c477e5d891b29a471908234671923058912304',
            authorUsername: 'alex-rivera',
            isDraft: false
          }).returning();
        }

        // Seed Sample Review Runs
        if (pr142) {
          let [run142] = await db
            .select()
            .from(reviewRuns)
            .where(eq(reviewRuns.pullRequestId, pr142.id))
            .limit(1);

          if (!run142) {
            [run142] = await db.insert(reviewRuns).values({
              organizationId: demoOrg.id,
              repositoryId: activeRepo.id,
              pullRequestId: pr142.id,
              commitSha: pr142.headSha,
              state: 'PASSED',
              policyOutcome: 'ALLOW',
              summary: 'Google Gemini 3.7 Flash AI Review passed with 0 security flaws. AST Graph and Shannon entropy verified 100% clean across all changed diffs.',
              criticalCount: 0,
              highCount: 0,
              mediumCount: 0,
              lowCount: 0,
              infoCount: 0,
              durationMs: 1420,
              startedAt: new Date(Date.now() - 3600 * 1000),
              completedAt: new Date(Date.now() - 3598 * 1000)
            }).returning();

            if (run142) {
              await db.insert(reviewStages).values([
                {
                  reviewRunId: run142.id,
                  name: 'GRAPH_RESOLVER',
                  status: 'COMPLETED',
                  durationMs: 180,
                  metadata: { filesParsed: 14, symbols: 84 }
                },
                {
                  reviewRunId: run142.id,
                  name: 'SECRET_SCAN',
                  status: 'COMPLETED',
                  durationMs: 95,
                  metadata: { entropyLeaks: 0, tokensEvaluated: 1842 }
                },
                {
                  reviewRunId: run142.id,
                  name: 'AI_ANALYSIS',
                  status: 'COMPLETED',
                  durationMs: 1050,
                  metadata: { model: 'Google Gemini 3.7 Flash', verdict: 'APPROVED', confidence: 0.99 }
                },
                {
                  reviewRunId: run142.id,
                  name: 'POLICY_EVALUATION',
                  status: 'COMPLETED',
                  durationMs: 95,
                  metadata: { rulesSatisfied: 3, rulesFailed: 0 }
                }
              ]).onConflictDoNothing();
            }
          }
        }

        // Seed Sample Review Findings
        if (pr142) {
          const findingsToSeed = [
            {
              organizationId: demoOrg.id,
              repositoryId: activeRepo.id,
              pullRequestId: pr142.id,
              fingerprint: 'fp_sec_001_ghp_entropy_token',
              severity: 'CRITICAL',
              category: 'SECRET',
              source: 'Shannon-Entropy-Scanner',
              title: 'Hardcoded GitHub Personal Access Token Committed',
              description: 'Shannon entropy analysis detected a high-entropy string matching GitHub API token format (ghp_*) in client authentication header.',
              filePath: 'packages/auth/src/token.ts',
              startLine: 30,
              endLine: 31,
              evidence: 'const GITHUB_ACCESS_TOKEN = "ghp_91823719827391827391827398127398";',
              impact: 'Exposed access tokens allow unauthorized API actions and access to private repositories.',
              recommendation: 'Remove token and inject via environment variables (GITHUB_TOKEN) from secret manager.',
              blocking: true,
              status: 'RESOLVED'
            },
            {
              organizationId: demoOrg.id,
              repositoryId: activeRepo.id,
              pullRequestId: pr142.id,
              fingerprint: 'fp_ast_002_dangerous_eval_rce',
              severity: 'HIGH',
              category: 'SAST',
              source: 'AST-Semantic-Parser',
              title: 'Dangerous dynamic eval() execution on untrusted input',
              description: 'AST traversal found direct invocation of eval() on untrusted config parameter, which introduces arbitrary Remote Code Execution vulnerabilities.',
              filePath: 'apps/api/src/routes/config.ts',
              startLine: 53,
              endLine: 54,
              evidence: 'return eval("(" + untrustedInput + ")");',
              impact: 'Attacker can execute arbitrary shell or Node.js commands in API container context.',
              recommendation: 'Use JSON.parse() with strict schema validation instead of dynamic code evaluation.',
              blocking: true,
              status: 'OPEN'
            },
            {
              organizationId: demoOrg.id,
              repositoryId: activeRepo.id,
              pullRequestId: pr142.id,
              fingerprint: 'fp_ast_003_race_condition_tx',
              severity: 'MEDIUM',
              category: 'ARCHITECTURE',
              source: 'Gemini-3.7-AI-Reviewer',
              title: 'Non-atomic payment balance deduction without database lock',
              description: 'Concurrency race condition detected where ledger updates occur across two non-transactional database statements without FOR UPDATE row lock.',
              filePath: 'apps/api/src/routes/billing.ts',
              startLine: 118,
              endLine: 125,
              evidence: 'await db.update(customers).set({ balance: current - amount });',
              impact: 'Concurrent checkout requests could lead to double-spend inconsistencies under high throughput.',
              recommendation: 'Wrap balance mutations in db.transaction() with atomic SQL subtraction: balance = balance - amount.',
              blocking: false,
              status: 'OPEN'
            }
          ];

          for (const f of findingsToSeed) {
            const [existing] = await db
              .select()
              .from(reviewFindings)
              .where(eq(reviewFindings.fingerprint, f.fingerprint))
              .limit(1);

            if (!existing) {
              await db.insert(reviewFindings).values(f as any).onConflictDoNothing();
            }
          }
        }
      }
    }

    logger.info('✅ Complete database seed completed successfully with all plans, features, benefits, customers, subscriptions, PRs, review runs, and findings.');
  } catch (error) {
    logger.error({ err: error }, '❌ Database seeding error');
  }
}

// Allow direct execution: tsx src/seed.ts
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
  seedDatabase().then(() => process.exit(0));
}
