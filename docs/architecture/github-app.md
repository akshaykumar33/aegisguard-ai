# CodeGuard — GitHub App Integration & Permission Model

## 1. Least-Privilege GitHub Permissions
CodeGuard enforces strict least-privilege permission scoping:

### Repository Permissions
- **Pull Requests**: `Read & Write` (to read diffs, post review comments, fetch metadata)
- **Checks**: `Read & Write` (to publish native GitHub Check Runs with pass/block outcomes)
- **Contents**: `Read-only` (to fetch source snapshots for indexing and diff analysis)
- **Commit Statuses**: `Read & Write` (to publish commit statuses for legacy branch protection)
- **Metadata**: `Read-only` (default required permission)

### Organization Permissions
- **Members**: `Read-only` (to map organization members to CodeGuard roles)

### Subscribed Events
- `pull_request` (`opened`, `synchronize`, `reopened`, `closed`)
- `pull_request_review`
- `check_run` (`rerequested`)
- `installation` (`created`, `deleted`, `suspend`, `unsuspend`)
- `installation_repositories` (`added`, `removed`)

## 2. Authentication Protocol
- **JWT Creation**: CodeGuard generates RS256-signed JWTs using the GitHub App's private key (`GITHUB_APP_PRIVATE_KEY`).
- **Installation Token**: Uses the JWT to request short-lived (1 hour) GitHub installation access tokens per tenant installation.
- **Token Caching**: Installation tokens are cached in Redis with TTLs (50 minutes) to minimize rate-limit overhead.
