# Administrator Guide & Governance Operations

## Organization Security Administration

### 1. Setting Up Organization Policies
As a security lead or administrator:
1. Navigate to the CodeGuard Web Admin Dashboard (`/dashboard`).
2. Configure Branch Protection rules:
   - Target patterns (`main`, `production`, `release/*`)
   - Mandatory human approvals ($\ge 2$)
   - Mandatory CODEOWNERS evaluation
   - Mandatory deterministic secret blocking
3. Save and sign the policy with the organization master key.

### 2. Monitoring Branch Drift
The Branch Drift Monitor tracks remote repository settings against organization standards. If a drift is detected:
- Review discrepancies in the dashboard.
- Click **Remediate Drift** to immediately restore organization standards on GitHub/GitLab.

### 3. Managing Emergency Break-Glass Overrides
During high-severity incidents:
- Issue time-bounded break-glass overrides via `/api/v1/emergency/break-glass`.
- Review post-incident audit trails in the immutable audit log.
