# Git Provider Integration (GitHub, GitLab, Bitbucket)

## Provider Abstraction Architecture

CodeGuard provides a unified `IGitProvider` interface decoupling business logic from provider-specific REST/GraphQL APIs.

### Supported Providers & Adapters
1. **GitHub (`GitHubProvider`)**: Octokit-based integration for GitHub.com and GitHub Enterprise Server. Supports App installations, Check Runs, and Branch Protection v3/v4.
2. **GitLab (`GitLabProvider`)**: GitLab REST API integration with Protected Branches, Merge Request notes, and Commit status updates.
3. **Bitbucket (`BitbucketProvider`)**: Bitbucket Cloud/Server branch restrictions and pull request review hooks.

```typescript
export interface IGitProvider {
  createBranchProtection(owner: string, repo: string, rule: BranchProtectionRule): Promise<void>;
  getBranchProtection(owner: string, repo: string, branch: string): Promise<Partial<BranchProtectionRule>>;
  verifyBranchProtection(owner: string, repo: string, branch: string, expected: BranchProtectionRule): Promise<BranchDriftReport>;
  remediateBranchProtection(owner: string, repo: string, branch: string, expected: BranchProtectionRule): Promise<DriftRemediationResult>;
  getReviews(owner: string, repo: string, pullNumber: number): Promise<ReviewSubmission[]>;
  getChecks(owner: string, repo: string, ref: string): Promise<Array<{ name: string; status: string; conclusion: string }>>;
  getCODEOWNERS(owner: string, repo: string, ref?: string): Promise<string | null>;
  mergePullRequest(owner: string, repo: string, pullNumber: number, method?: 'squash' | 'merge' | 'rebase'): Promise<void>;
}
```
