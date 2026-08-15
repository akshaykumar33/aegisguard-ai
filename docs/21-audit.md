# Audit Logging & Compliance

## Immutable Governance Audit Trail

Every state-changing action in CodeGuard is permanently recorded in the `audit_logs` table.

### Monitored Audit Actions
- `POLICY_CREATED` / `POLICY_UPDATED`: Changes to organization security rules.
- `BRANCH_PROTECTION_CONFIGURED`: Application of branch protection rules.
- `BRANCH_PROTECTION_DRIFT_REMEDIATED`: Self-healing remediation of drifted branch rules.
- `EMERGENCY_BREAK_GLASS_REQUESTED`: Activation of emergency override.
- `EMERGENCY_BREAK_GLASS_EXPIRED`: Expiry or revocation of break-glass access.
- `PULL_REQUEST_MERGED`: Authoritative server-side merge execution.

### Compliance Mapping
- **SOC 2 Type II**: Strict separation of duties, mandatory 2-person peer review, immutable access logs.
- **ISO 27001**: Access control, secret protection, cryptography.
- **PCI-DSS & HIPAA**: PII and credit card detection, masked credential logs.
