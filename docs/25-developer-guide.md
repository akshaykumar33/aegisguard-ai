# Developer Guide & Best Practices

## Working with CodeGuard

Welcome to CodeGuard. This guide outlines standard day-to-day development workflows.

### 1. Initialize Local Repository
In your local repository root:
```bash
codeguard init
```
This configures your local Git hooks, verifies the organization policy signature, and prepares your workspace.

### 2. Create Compliant Feature Branches
```bash
codeguard branch
# Or manually: git checkout -b feat/add-payment-method
```

### 3. Write Conventional Commits
```bash
codeguard commit "feat(auth): add refresh token rotation"
```

### 4. Check Status Before Pushing
```bash
codeguard check
codeguard status
```

### 5. Pull Request & Review
When you open a PR:
- CodeGuard automatically analyzes your changes within 30 seconds.
- Review 1-click suggestions on your PR diff.
- Obtain mandatory 2 human peer approvals from designated CODEOWNERS to unlock the merge gate.
