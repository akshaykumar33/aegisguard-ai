import { describe, it, expect } from 'vitest';
import { suggestConventionalCommit } from './commands/commit.js';
import { LocalPolicyManager } from './policyManager.js';

describe('CLI Conventional Commit & Policy Tests', () => {
  it('should suggest conventional commit format for unstructured messages', () => {
    expect(suggestConventionalCommit('fixed login bug')).toBe('fix: login bug');
    expect(suggestConventionalCommit('added stripe payments')).toBe('feat: stripe payments');
    expect(suggestConventionalCommit('updated architecture documentation')).toBe('docs: architecture documentation');
    expect(suggestConventionalCommit('refactored auth service')).toBe('refactor: auth service');
    expect(suggestConventionalCommit('upgraded pnpm dependencies')).toBe('chore: pnpm dependencies');
    expect(suggestConventionalCommit('optimized database query')).toBe('perf: database query');
  });

  it('should load valid signed default policy with cryptographic verification', () => {
    const policyResult = LocalPolicyManager.loadPolicy();
    expect(policyResult.isVerified).toBe(true);
    expect(policyResult.policy.rules.length).toBeGreaterThan(0);
    expect(policyResult.policy.branchPolicies).toBeDefined();
    const mainRule = policyResult.policy.branchPolicies?.find((b) => b.pattern === 'main');
    expect(mainRule?.requiredApprovals).toBe(2);
    expect(mainRule?.requirePullRequest).toBe(true);
  });
});
