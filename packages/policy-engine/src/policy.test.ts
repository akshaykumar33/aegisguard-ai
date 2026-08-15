import { describe, it, expect } from 'vitest';
import { PolicyEngine, CodeOwnersEngine } from './index.js';
import type { Finding, Policy, ReviewSubmission } from '@codeguard/types';

describe('Policy Engine Rules & Enforcement', () => {
  const defaultPolicy: Policy = {
    id: 'pol-1',
    organizationId: 'org-1',
    name: 'Standard Zero-Trust Security Policy',
    version: '1.0.0',
    level: 'ORGANIZATION',
    isDefault: true,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    rules: [
      {
        id: 'rule-1',
        policyId: 'pol-1',
        name: 'Block Secrets',
        ruleType: 'SECRET_BLOCK',
        condition: {},
        action: 'BLOCK',
        enabled: true
      },
      {
        id: 'rule-2',
        policyId: 'pol-1',
        name: 'Block Critical Severity',
        ruleType: 'SEVERITY_THRESHOLD',
        condition: { minSeverity: 'CRITICAL' },
        action: 'BLOCK',
        enabled: true
      },
      {
        id: 'rule-3',
        policyId: 'pol-1',
        name: 'Warn on High Severity',
        ruleType: 'SEVERITY_THRESHOLD',
        condition: { minSeverity: 'HIGH' },
        action: 'WARN',
        enabled: true
      }
    ]
  };

  it('should return ALLOW when no findings violate the policy', () => {
    const findings: Finding[] = [
      {
        id: 'f-1',
        organizationId: 'org-1',
        repositoryId: 'repo-1',
        fingerprint: 'fp-1',
        severity: 'LOW',
        category: 'CODE_QUALITY',
        source: 'AI',
        title: 'Unused variable',
        description: 'Remove unused variable',
        filePath: 'src/utils.ts',
        startLine: 12,
        endLine: 12,
        confidence: 0.95,
        blocking: false,
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const result = PolicyEngine.evaluate(defaultPolicy, findings);
    expect(result.outcome).toBe('ALLOW');
    expect(result.blockingFindingIds.length).toBe(0);
  });

  it('should return BLOCK when a high-confidence secret is detected', () => {
    const findings: Finding[] = [
      {
        id: 'f-secret',
        organizationId: 'org-1',
        repositoryId: 'repo-1',
        fingerprint: 'fp-secret',
        severity: 'CRITICAL',
        category: 'SECRET',
        source: 'DETERMINISTIC',
        title: 'AWS Secret Access Key Exposed',
        description: 'Hardcoded AWS secret detected in code',
        filePath: 'config/aws.ts',
        startLine: 5,
        endLine: 5,
        confidence: 1.0,
        blocking: true,
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const result = PolicyEngine.evaluate(defaultPolicy, findings);
    expect(result.outcome).toBe('BLOCK');
    expect(result.blockingFindingIds).toContain('f-secret');
    expect(result.reasons[0]).toContain('Secret Exposure');
  });

  it('should return WARN when only HIGH severity issues exist', () => {
    const policyOnlyWarn: Policy = {
      ...defaultPolicy,
      rules: defaultPolicy.rules.filter((r) => r.ruleType !== 'SECRET_BLOCK' && r.name !== 'Block Critical Severity')
    };

    const findings: Finding[] = [
      {
        id: 'f-high',
        organizationId: 'org-1',
        repositoryId: 'repo-1',
        fingerprint: 'fp-high',
        severity: 'HIGH',
        category: 'SECURITY',
        source: 'DETERMINISTIC',
        title: 'Insecure Regular Expression (ReDoS)',
        description: 'Vulnerable regex pattern',
        filePath: 'src/parser.ts',
        startLine: 40,
        endLine: 40,
        confidence: 0.9,
        blocking: false,
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const result = PolicyEngine.evaluate(policyOnlyWarn, findings);
    expect(result.outcome).toBe('WARN');
  });

  it('should block direct push to protected branches for developers and AI agents', () => {
    const devPushResult = PolicyEngine.evaluateAction(
      { id: 'user-1', type: 'DEVELOPER' },
      'main',
      'PUSH'
    );
    expect(devPushResult.allowed).toBe(false);
    expect(devPushResult.action).toBe('BLOCK');
    expect(devPushResult.reason).toContain('strictly prohibited');

    const aiPushResult = PolicyEngine.evaluateAction(
      { id: 'ai-agent-1', type: 'AI_AGENT' },
      'release/v1.0.0',
      'PUSH'
    );
    expect(aiPushResult.allowed).toBe(false);
    expect(aiPushResult.action).toBe('BLOCK');

    const featurePushResult = PolicyEngine.evaluateAction(
      { id: 'user-1', type: 'DEVELOPER' },
      'feature/PROJ-123-auth',
      'PUSH'
    );
    expect(featurePushResult.allowed).toBe(true);
    expect(featurePushResult.action).toBe('ALLOW');
  });

  it('should evaluate merge decisions strictly requiring mandatory human approvals', () => {
    const reviews: ReviewSubmission[] = [
      {
        id: 'rev-1',
        pullRequestId: 'pr-1',
        reviewerUsername: 'ai-bot',
        reviewerType: 'AI_AGENT',
        reviewType: 'AI_REVIEW',
        state: 'APPROVED',
        submittedAt: new Date()
      },
      {
        id: 'rev-2',
        pullRequestId: 'pr-1',
        reviewerUsername: 'alice',
        reviewerType: 'DEVELOPER',
        reviewType: 'HUMAN_REVIEW',
        state: 'APPROVED',
        submittedAt: new Date()
      }
    ];

    // Case A: 1 Human Approval when 2 are required -> BLOCKED
    const blockedDecision = PolicyEngine.evaluateMergeDecision({
      branch: 'main',
      pullRequest: {
        number: 42,
        title: 'Add payments API',
        sourceBranch: 'feature/payments',
        targetBranch: 'main',
        isDraft: false
      },
      reviews,
      checks: [{ name: 'CI / Tests', status: 'completed', conclusion: 'success' }],
      findings: [],
      changedFiles: ['src/payments.ts']
    });

    expect(blockedDecision.outcome).toBe('MERGE_BLOCKED');
    expect(blockedDecision.currentApprovals).toBe(1);
    expect(blockedDecision.requiredApprovals).toBe(2);
    expect(blockedDecision.blockingItems).toContain('Insufficient human approvals (1/2 required)');

    // Case B: 2 Human Approvals -> ALLOWED
    reviews.push({
      id: 'rev-3',
      pullRequestId: 'pr-1',
      reviewerUsername: 'bob',
      reviewerType: 'DEVELOPER',
      reviewType: 'HUMAN_REVIEW',
      state: 'APPROVED',
      submittedAt: new Date()
    });

    const allowedDecision = PolicyEngine.evaluateMergeDecision({
      branch: 'main',
      pullRequest: {
        number: 42,
        title: 'Add payments API',
        sourceBranch: 'feature/payments',
        targetBranch: 'main',
        isDraft: false
      },
      reviews,
      checks: [{ name: 'CI / Tests', status: 'completed', conclusion: 'success' }],
      findings: [],
      changedFiles: ['src/payments.ts']
    });

    expect(allowedDecision.outcome).toBe('MERGE_ALLOWED');
    expect(allowedDecision.currentApprovals).toBe(2);
  });

  it('should evaluate CODEOWNERS correctly', () => {
    const codeOwnersContent = `
# Global default
* @team-lead

# Security sensitive services
/services/auth/ @security-team
/services/payments/ @payments-team @alice
`;
    const evalResult = CodeOwnersEngine.evaluate(
      codeOwnersContent,
      ['services/payments/stripe.ts'],
      ['alice', 'bob']
    );

    expect(evalResult.requiredOwners).toContain('@payments-team');
    expect(evalResult.requiredOwners).toContain('@alice');
    expect(evalResult.approvedOwners).toContain('@alice');
    expect(evalResult.missingOwners).toContain('@payments-team');
    expect(evalResult.satisfied).toBe(false);

    // When both alice and payments-team approve
    const satisfiedResult = CodeOwnersEngine.evaluate(
      codeOwnersContent,
      ['services/payments/stripe.ts'],
      ['alice', 'payments-team']
    );
    expect(satisfiedResult.satisfied).toBe(true);
  });

  it('should sign and verify policy signatures and detect tampering', () => {
    const secret = 'super-secure-org-secret-key-123';
    const signedPolicy = PolicyEngine.signPolicy(defaultPolicy, secret);

    expect(signedPolicy.signature).toBeDefined();
    expect(signedPolicy.signatureAlgorithm).toBe('HMAC-SHA256');

    // Verify valid signature
    const verifyValid = PolicyEngine.verifySignedPolicy(signedPolicy, secret);
    expect(verifyValid.valid).toBe(true);

    // Tamper with policy rules
    const tampered = JSON.parse(JSON.stringify(signedPolicy));
    tampered.policy.rules[0].action = 'ALLOW';

    const verifyTampered = PolicyEngine.verifySignedPolicy(tampered, secret);
    expect(verifyTampered.valid).toBe(false);
    expect(verifyTampered.reason).toContain('tampered');
  });

  it('should detect configuration drift between expected policy and actual provider rules', () => {
    const expected = {
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
      requiredStatusChecks: ['CI']
    };

    const actual = {
      requiredApprovals: 0, // Drift!
      enforceAdmins: false // Drift!
    };

    const driftReport = PolicyEngine.detectDrift('repo-1', 'main', expected, actual);
    expect(driftReport.inSync).toBe(false);
    expect(driftReport.driftStatus).toBe('DRIFTED');
    expect(driftReport.discrepancies.length).toBeGreaterThan(0);
  });
});
