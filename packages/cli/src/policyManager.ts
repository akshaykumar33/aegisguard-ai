import fs from 'node:fs';
import path from 'node:path';
import { PolicyEngine } from '@codeguard/policy-engine';
import type { Policy, SignedPolicy } from '@codeguard/types';

export const DEFAULT_LOCAL_POLICY: Policy = {
  id: 'pol-org-default',
  organizationId: 'org-enterprise-root',
  name: 'Enterprise Zero-Trust Branch & Code Governance Policy',
  version: '1.0.0',
  level: 'ORGANIZATION',
  isDefault: true,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  branchPolicies: [
    {
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
    },
    {
      pattern: 'master',
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
    },
    {
      pattern: 'production',
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
      requireSignedCommits: true,
      requireLinearHistory: true,
      requiredStatusChecks: ['CodeGuard Security & Review', 'CI / Tests']
    },
    {
      pattern: 'release/*',
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
    }
  ],
  rules: [
    {
      id: 'rule-secret-block',
      policyId: 'pol-org-default',
      name: 'Deterministic Secret Blocking',
      ruleType: 'SECRET_BLOCK',
      condition: {},
      action: 'BLOCK',
      enabled: true
    },
    {
      id: 'rule-sast-block',
      policyId: 'pol-org-default',
      name: 'High & Critical SAST Blocking',
      ruleType: 'SAST_BLOCK',
      condition: { minSeverity: 'HIGH' },
      action: 'BLOCK',
      enabled: true
    }
  ]
};

const DEFAULT_SIGNING_KEY = 'codeguard-enterprise-policy-secret-key';

export class LocalPolicyManager {
  static getPolicyPath(targetDir = process.cwd()): string {
    return path.join(targetDir, '.codeguard', 'policy.json');
  }

  static savePolicy(policy: Policy, targetDir = process.cwd()): SignedPolicy {
    const codeguardDir = path.join(targetDir, '.codeguard');
    if (!fs.existsSync(codeguardDir)) {
      fs.mkdirSync(codeguardDir, { recursive: true });
    }

    const signed = PolicyEngine.signPolicy(policy, DEFAULT_SIGNING_KEY);
    fs.writeFileSync(this.getPolicyPath(targetDir), JSON.stringify(signed, null, 2), 'utf8');
    return signed;
  }

  static loadPolicy(targetDir = process.cwd()): { policy: Policy; isVerified: boolean; error?: string } {
    const policyFile = this.getPolicyPath(targetDir);
    if (!fs.existsSync(policyFile)) {
      // Return default unsigned fallback
      return { policy: DEFAULT_LOCAL_POLICY, isVerified: true };
    }

    try {
      const raw = fs.readFileSync(policyFile, 'utf8');
      const signedPolicy: SignedPolicy = JSON.parse(raw);
      const verification = PolicyEngine.verifySignedPolicy(signedPolicy, DEFAULT_SIGNING_KEY);

      if (!verification.valid) {
        return {
          policy: DEFAULT_LOCAL_POLICY,
          isVerified: false,
          error: verification.reason || 'Digital signature invalid'
        };
      }

      return { policy: signedPolicy.policy, isVerified: true };
    } catch {
      return {
        policy: DEFAULT_LOCAL_POLICY,
        isVerified: false,
        error: 'Failed to parse local policy file. Using secure default organization policy.'
      };
    }
  }
}
