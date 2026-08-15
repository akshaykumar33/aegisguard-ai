# Branch Protection & Drift Remediation

## Server-Authoritative Branch Protection

CodeGuard implements an impenetrable, server-side branch protection gate across all connected Git providers (GitHub, GitLab, Bitbucket).

### Protected Branches
Default protected branch patterns:
- `main`, `master`
- `production`, `prod`
- `staging`, `stage`
- `develop`, `development`
- `release/*`, `hotfix/*`

### Mandatory Branch Rules
Every protected branch requires:
1. `requirePullRequest: true`: Direct pushes are blocked for developers, AI agents, and CI bots.
2. `requiredApprovals: 2`: Minimum 2 human peer approvals. AI review approval does not count.
3. `requireCodeOwners: true`: Approvals from designated CODEOWNERS are strictly required for sensitive paths.
4. `requireLinearHistory: true`: Fast-forward merge or squash-and-merge only; messy merge commits prohibited.
5. `enforceAdmins: true`: Administrators cannot bypass rules without an explicit break-glass override.
6. `preventForcePush: true`: History rewriting on protected branches is permanently disabled.
7. `preventDeletion: true`: Protected branches cannot be deleted.

### Automated Drift Detection & Self-Healing
If an administrator or provider setting weakens branch protection (e.g. lowering required approvals from 2 to 1):
- `PolicyEngine.detectDrift` discovers discrepancies in real time.
- The Git Provider Remediator automatically re-applies organization policies.
- A critical audit log event (`BRANCH_PROTECTION_DRIFT_REMEDIATED`) is recorded.
