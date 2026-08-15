import crypto from 'node:crypto';
import type {
  ActorType,
  BranchProtectionRule,
  BranchDriftReport,
  Finding,
  FindingSeverity,
  MergeDecisionResult,
  Policy,
  PolicyAction,
  PolicyExecutionResult,
  PolicyRule,
  ReviewSubmission,
  SignedPolicy
} from '@codeguard/types';
import { CodeOwnersEngine } from './codeowners.js';

export * from './codeowners.js';
export * from './entitlements.js';
export * from './billing.js';
export * from './notifications.js';

export const SEVERITY_LEVELS: Record<FindingSeverity, number> = {
  CRITICAL: 50,
  HIGH: 40,
  MEDIUM: 30,
  LOW: 20,
  INFO: 10
};

export const DEFAULT_PROTECTED_BRANCH_PATTERNS = [
  'main',
  'master',
  'production',
  'prod',
  'staging',
  'stage',
  'develop',
  'development',
  'release/*',
  'hotfix/*'
];

export interface PolicyEvaluationContext {
  targetBranch: string;
  isDraft: boolean;
  authorUsername: string;
  changedFileCount: number;
}

export interface MergeEvaluationContext {
  branch: string;
  pullRequest: {
    number: number;
    title: string;
    sourceBranch: string;
    targetBranch: string;
    isDraft: boolean;
  };
  branchPolicy?: BranchProtectionRule;
  reviews: ReviewSubmission[];
  checks: Array<{ name: string; status: string; conclusion: string }>;
  findings: Finding[];
  changedFiles: string[];
  codeOwnersContent?: string;
  isBreakGlassActive?: boolean;
}

export class PolicyEngine {
  /**
   * Evaluate findings against an organization/repository policy
   */
  static evaluate(
    policy: Policy,
    findings: Finding[],
    context?: Partial<PolicyEvaluationContext>
  ): PolicyExecutionResult {
    if (!policy.enabled) {
      return {
        policyId: policy.id,
        outcome: 'ALLOW',
        reasons: ['Policy is disabled'],
        blockingFindingIds: []
      };
    }

    let highestAction: PolicyAction = 'ALLOW';
    const reasonSet = new Set<string>();
    const blockingFindingIds = new Set<string>();

    for (const rule of policy.rules) {
      if (!rule.enabled) continue;

      const ruleResult = this.evaluateRule(rule, findings, context);
      if (ruleResult.matched) {
        for (const r of ruleResult.reasons) {
          reasonSet.add(r);
        }
        for (const id of ruleResult.affectedFindingIds) {
          if (rule.action === 'BLOCK') {
            blockingFindingIds.add(id);
          }
        }
        highestAction = this.combineActions(highestAction, rule.action);
      }
    }

    const reasons = Array.from(reasonSet);

    return {
      policyId: policy.id,
      outcome: highestAction,
      reasons: reasons.length > 0 ? reasons : ['All policy checks passed without blocking conditions.'],
      blockingFindingIds: Array.from(blockingFindingIds)
    };
  }

  /**
   * Evaluate direct branch operations (e.g. direct push or commit)
   */
  static evaluateAction(
    actor: { id: string; type: ActorType },
    branch: string,
    action: 'PUSH' | 'MERGE' | 'COMMIT',
    customProtectedPatterns: string[] = DEFAULT_PROTECTED_BRANCH_PATTERNS
  ): { allowed: boolean; action: PolicyAction; reason: string } {
    const isProtected = this.matchesProtectedBranch(branch, customProtectedPatterns);

    if (isProtected && action === 'PUSH') {
      return {
        allowed: false,
        action: 'BLOCK',
        reason: `Direct push to protected branch "${branch}" is strictly prohibited for ${actor.type}. Changes must be made via feature branch and Pull Request.`
      };
    }

    return {
      allowed: true,
      action: 'ALLOW',
      reason: `Action ${action} on branch "${branch}" is permitted.`
    };
  }

  /**
   * Authoritative server-side merge decision evaluation
   * AI reviews NEVER replace mandatory human approvals.
   */
  static evaluateMergeDecision(ctx: MergeEvaluationContext): MergeDecisionResult {
    const reasons: string[] = [];
    const blockingItems: string[] = [];

    const branchRule = ctx.branchPolicy ?? {
      pattern: 'main',
      requirePullRequest: true,
      requiredApprovals: 2,
      requireCodeOwners: true,
      requireAiReview: true,
      requireSecurityScan: true,
      requireTests: true,
      requireSecretScan: true,
      enforceAdmins: true,
      preventForcePush: true,
      preventDeletion: true,
      requireSignedCommits: false,
      requireLinearHistory: true,
      requiredStatusChecks: ['CodeGuard Security & Review', 'CI / Tests']
    };

    if (ctx.isBreakGlassActive) {
      return {
        branchProtected: true,
        requiredPR: branchRule.requirePullRequest,
        aiReviewPassed: true,
        securityPassed: true,
        secretScanPassed: true,
        testsPassed: true,
        requiredApprovals: branchRule.requiredApprovals,
        currentApprovals: 0,
        codeOwnersSatisfied: true,
        isBreakGlassActive: true,
        outcome: 'MERGE_ALLOWED',
        reasons: ['EMERGENCY BREAK-GLASS OVERRIDE ACTIVE: Merging authorized under privileged audit trail.'],
        blockingItems: []
      };
    }

    // 1. Check Draft status
    if (ctx.pullRequest.isDraft) {
      blockingItems.push('Pull Request is currently in Draft mode');
      reasons.push('Cannot merge draft pull request.');
    }

    // 2. Separate Human Approvals from AI reviews (AI can NEVER substitute human approval)
    const humanApprovals = ctx.reviews.filter(
      (r) => r.reviewType === 'HUMAN_REVIEW' && r.state === 'APPROVED'
    );
    const humanChangesRequested = ctx.reviews.filter(
      (r) => r.reviewType === 'HUMAN_REVIEW' && r.state === 'CHANGES_REQUESTED'
    );

    if (humanChangesRequested.length > 0) {
      const reviewers = humanChangesRequested.map((r) => r.reviewerUsername).join(', ');
      blockingItems.push(`Changes requested by human reviewer(s): ${reviewers}`);
      reasons.push(`Blocker: Changes requested by ${reviewers}.`);
    }

    const currentApprovals = humanApprovals.length;
    const requiredApprovals = branchRule.requiredApprovals;

    if (currentApprovals < requiredApprovals) {
      blockingItems.push(`Insufficient human approvals (${currentApprovals}/${requiredApprovals} required)`);
      reasons.push(`Requires at least ${requiredApprovals} human peer approval(s); currently has ${currentApprovals}.`);
    }

    // 3. CODEOWNERS validation
    let codeOwnersSatisfied = true;
    if (branchRule.requireCodeOwners && ctx.codeOwnersContent && ctx.changedFiles.length > 0) {
      const approvedReviewers = humanApprovals.map((r) => r.reviewerUsername);
      const codeOwnersEval = CodeOwnersEngine.evaluate(
        ctx.codeOwnersContent,
        ctx.changedFiles,
        approvedReviewers
      );
      codeOwnersSatisfied = codeOwnersEval.satisfied;
      if (!codeOwnersSatisfied) {
        blockingItems.push(`Missing CODEOWNERS approval from: ${codeOwnersEval.missingOwners.join(', ')}`);
        reasons.push(`CODEOWNERS gate: Mandatory approvals required from ${codeOwnersEval.missingOwners.join(', ')}.`);
      }
    }

    // 4. Secret Scanner validation
    const secretFindings = ctx.findings.filter((f) => f.category === 'SECRET' && f.status === 'OPEN');
    const secretScanPassed = secretFindings.length === 0;
    if (!secretScanPassed) {
      blockingItems.push(`Exposed credentials detected (${secretFindings.length} open secret findings)`);
      reasons.push(`Secret Scanner: ${secretFindings.length} unmasked secret(s) must be revoked/removed.`);
    }

    // 5. Security & SAST findings
    const criticalOrHighFindings = ctx.findings.filter(
      (f) => (f.severity === 'CRITICAL' || f.severity === 'HIGH') && f.status === 'OPEN'
    );
    const securityPassed = criticalOrHighFindings.length === 0;
    if (!securityPassed) {
      blockingItems.push(`Critical/High security vulnerabilities detected (${criticalOrHighFindings.length} open findings)`);
      reasons.push(`Security Gate: ${criticalOrHighFindings.length} critical/high issue(s) remain open.`);
    }

    // 6. AI Review verification
    const aiReviewPassed = !ctx.findings.some(
      (f) => f.source === 'AI' && f.blocking && f.status === 'OPEN'
    );
    if (!aiReviewPassed) {
      blockingItems.push('Blocking AI review issues remain unresolved');
      reasons.push('AI Review Gate: Open blocking issues identified during AI analysis.');
    }

    // 7. CI / Tests status check validation
    const failedChecks = ctx.checks.filter((c) => c.conclusion === 'failure' || c.conclusion === 'timed_out');
    const testsPassed = failedChecks.length === 0;
    if (!testsPassed) {
      const checkNames = failedChecks.map((c) => c.name).join(', ');
      blockingItems.push(`Required CI checks failed: ${checkNames}`);
      reasons.push(`CI Gate: Required status checks failed (${checkNames}).`);
    }

    const outcome = blockingItems.length === 0 ? 'MERGE_ALLOWED' : 'MERGE_BLOCKED';

    return {
      branchProtected: true,
      requiredPR: branchRule.requirePullRequest,
      aiReviewPassed,
      securityPassed,
      secretScanPassed,
      testsPassed,
      requiredApprovals,
      currentApprovals,
      codeOwnersSatisfied,
      isBreakGlassActive: false,
      outcome,
      reasons: outcome === 'MERGE_ALLOWED' ? ['All mandatory security, CI, AI review, and human peer approvals satisfied.'] : reasons,
      blockingItems
    };
  }

  /**
   * Helper to check if a branch matches configured protected patterns
   */
  static matchesProtectedBranch(branch: string, patterns: string[] = DEFAULT_PROTECTED_BRANCH_PATTERNS): boolean {
    const cleanBranch = branch.trim();
    for (const pattern of patterns) {
      const cleanPattern = pattern.trim();
      if (cleanPattern.endsWith('/*')) {
        const prefix = cleanPattern.slice(0, -2);
        if (cleanBranch === prefix || cleanBranch.startsWith(`${prefix}/`)) {
          return true;
        }
      } else if (cleanPattern.endsWith('*')) {
        const prefix = cleanPattern.slice(0, -1);
        if (cleanBranch.startsWith(prefix)) {
          return true;
        }
      } else if (cleanBranch === cleanPattern) {
        return true;
      }
    }
    return false;
  }

  /**
   * Policy Hierarchy Validator:
   * Ensures repository or branch policies never weaken organization policies (e.g. lowering required approvals).
   */
  static validatePolicyHierarchy(orgPolicy: Policy, childPolicy: Policy): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check branch policies if present
    if (orgPolicy.branchPolicies && childPolicy.branchPolicies) {
      for (const orgBp of orgPolicy.branchPolicies) {
        const childBp = childPolicy.branchPolicies.find((c) => c.pattern === orgBp.pattern);
        if (childBp) {
          if (childBp.requiredApprovals < orgBp.requiredApprovals) {
            errors.push(
              `Child policy for pattern "${childBp.pattern}" weakens requiredApprovals (${childBp.requiredApprovals} < ${orgBp.requiredApprovals})`
            );
          }
          if (orgBp.requireCodeOwners && !childBp.requireCodeOwners) {
            errors.push(`Child policy disables mandatory requireCodeOwners for "${childBp.pattern}"`);
          }
          if (orgBp.requireSecurityScan && !childBp.requireSecurityScan) {
            errors.push(`Child policy disables mandatory requireSecurityScan for "${childBp.pattern}"`);
          }
          if (orgBp.enforceAdmins && !childBp.enforceAdmins) {
            errors.push(`Child policy disables enforceAdmins for "${childBp.pattern}"`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Digitally sign a policy payload for tamper-proof local caching and CLI distribution
   */
  static signPolicy(policy: Policy, secretKey: string, keyId = 'org-master-key-1', expiresInSeconds = 86400): SignedPolicy {
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
    const version = policy.version || '1.0.0';

    const payload = JSON.stringify({ policy, version, issuedAt, expiresAt, keyId });
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    return {
      policy,
      version,
      issuedAt,
      expiresAt,
      signature,
      signatureAlgorithm: 'HMAC-SHA256',
      keyId
    };
  }

  /**
   * Verify digital signature and expiry of a cached/distributed policy
   */
  static verifySignedPolicy(signedPolicy: SignedPolicy, secretKey: string): { valid: boolean; reason?: string } {
    if (!signedPolicy || !signedPolicy.signature) {
      return { valid: false, reason: 'Missing digital signature' };
    }

    if (new Date(signedPolicy.expiresAt).getTime() < Date.now()) {
      return { valid: false, reason: 'Policy signature has expired. Please sync with organization governance.' };
    }

    const { policy, version, issuedAt, expiresAt, keyId } = signedPolicy;
    const payload = JSON.stringify({ policy, version, issuedAt, expiresAt, keyId });

    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signedPolicy.signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );

    return isValid ? { valid: true } : { valid: false, reason: 'Digital signature mismatch: policy has been tampered with.' };
  }

  /**
   * Detect configuration drift between expected organization policy and active Git provider settings
   */
  static detectDrift(
    repositoryId: string,
    branch: string,
    expected: BranchProtectionRule,
    actual: Partial<BranchProtectionRule>
  ): BranchDriftReport {
    const discrepancies: string[] = [];

    if (actual.requiredApprovals !== undefined && actual.requiredApprovals < expected.requiredApprovals) {
      discrepancies.push(`Required approvals drifted: expected ${expected.requiredApprovals}, actual ${actual.requiredApprovals}`);
    }
    if (expected.enforceAdmins && !actual.enforceAdmins) {
      discrepancies.push('Enforce admins is disabled on provider');
    }
    if (expected.preventForcePush && actual.preventForcePush === false) {
      discrepancies.push('Force pushes are currently permitted on provider');
    }
    if (expected.requireLinearHistory && actual.requireLinearHistory === false) {
      discrepancies.push('Linear history requirement is disabled on provider');
    }
    if (expected.requireCodeOwners && actual.requireCodeOwners === false) {
      discrepancies.push('CODEOWNERS review requirement is disabled on provider');
    }

    const inSync = discrepancies.length === 0;

    return {
      repositoryId,
      branch,
      inSync,
      driftStatus: inSync ? 'IN_SYNC' : 'DRIFTED',
      expected,
      actual,
      discrepancies,
      detectedAt: new Date()
    };
  }

  private static evaluateRule(
    rule: PolicyRule,
    findings: Finding[],
    context?: Partial<PolicyEvaluationContext>
  ): { matched: boolean; reasons: string[]; affectedFindingIds: string[] } {
    const reasons: string[] = [];
    const affectedFindingIds: string[] = [];

    switch (rule.ruleType) {
      case 'SECRET_BLOCK': {
        const secretFindings = findings.filter(
          (f) => f.category === 'SECRET' && f.status === 'OPEN' && f.confidence >= 0.7
        );
        if (secretFindings.length > 0) {
          for (const sf of secretFindings) {
            affectedFindingIds.push(sf.id);
            reasons.push(`Secret Exposure: \`${sf.filePath}:${sf.startLine}\` (${sf.title})`);
          }
          return { matched: true, reasons, affectedFindingIds };
        }
        break;
      }

      case 'SEVERITY_THRESHOLD': {
        const minSeverity = (rule.condition.minSeverity as FindingSeverity) || 'CRITICAL';
        const minThreshold = SEVERITY_LEVELS[minSeverity] ?? 50;

        const violatingFindings = findings.filter(
          (f) => f.category !== 'SECRET' && f.status === 'OPEN' && (SEVERITY_LEVELS[f.severity] ?? 0) >= minThreshold
        );

        if (violatingFindings.length > 0) {
          for (const vf of violatingFindings) {
            affectedFindingIds.push(vf.id);
            reasons.push(`[${vf.severity}] Quality Gate Breached: \`${vf.filePath}:${vf.startLine}\` (${vf.title})`);
          }
          return { matched: true, reasons, affectedFindingIds };
        }
        break;
      }

      case 'ARCHITECTURE_VIOLATION': {
        const archFindings = findings.filter(
          (f) => f.category === 'ARCHITECTURE' && f.status === 'OPEN'
        );
        if (archFindings.length > 0) {
          for (const af of archFindings) {
            affectedFindingIds.push(af.id);
            reasons.push(`Architecture Violation: \`${af.filePath}:${af.startLine}\` (${af.title})`);
          }
          return { matched: true, reasons, affectedFindingIds };
        }
        break;
      }

      case 'SAST_BLOCK': {
        const sastFindings = findings.filter(
          (f) => (f.category === 'SAST' || f.category === 'SECURITY') &&
            f.status === 'OPEN' &&
            (f.severity === 'CRITICAL' || f.severity === 'HIGH')
        );
        if (sastFindings.length > 0) {
          for (const sf of sastFindings) {
            affectedFindingIds.push(sf.id);
            reasons.push(`Vulnerability: [${sf.severity}] \`${sf.filePath}:${sf.startLine}\` (${sf.title})`);
          }
          return { matched: true, reasons, affectedFindingIds };
        }
        break;
      }

      default:
        break;
    }

    return { matched: false, reasons: [], affectedFindingIds: [] };
  }

  private static combineActions(a: PolicyAction, b: PolicyAction): PolicyAction {
    const priority: Record<PolicyAction, number> = {
      BLOCK: 40,
      REQUIRE_APPROVAL: 30,
      WARN: 20,
      ALLOW: 10
    };
    return (priority[b] ?? 0) > (priority[a] ?? 0) ? b : a;
  }
}
