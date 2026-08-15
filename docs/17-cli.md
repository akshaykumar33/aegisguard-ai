# Local Governance CLI (`codeguard` / `orgcode`)

## Dual Binary CLI Architecture

The CodeGuard CLI operates as both `codeguard` and `orgcode` across developer machines and CI pipelines.

### CLI Commands

1. **`codeguard init`**:
   Interactive 10-step onboarding runner:
   - Detects Git root
   - Installs pre-commit, pre-push, and commit-msg hooks
   - Downloads and verifies signed organization policy
   - Configures local cache in `.codeguard/`

2. **`codeguard doctor`**:
   Terminal diagnostics table verifying Git repo health, hook installation, and policy signature integrity.

3. **`codeguard status`**:
   Real-time developer dashboard showing policy sync, branch validity, secrets check, PR #, AI review status, and human approvals count.

4. **`codeguard check`**:
   Pre-flight check running local secret scanning, SAST, branch naming, and commit convention validators.

5. **`codeguard commit "<message>"`**:
   Conventional Commits helper suggesting standard types (`feat:`, `fix:`, `chore:`) and valid scopes.

6. **`codeguard branch`**:
   Interactive branch creator generating compliant names (`feat/ticket-123-oauth-refresh`).

7. **`codeguard review`**:
   Runs local static analysis and secret scan before pushing.
