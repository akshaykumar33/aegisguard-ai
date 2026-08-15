# PHASE 6 PROMPT: Enterprise SSO, SAML/OIDC & Signed Audit Governance

## ROLE
Act as a **Staff Security & Enterprise Identity Architect**.

## CONTEXT
You are implementing enterprise security controls, SAML 2.0 / OIDC single sign-on (SSO), and cryptographically signed audit logs for CodeGuard AI.

## TARGET SPECIFICATIONS
1. **Enterprise SSO & Identity Federation**:
   - Integrate Okta, Azure AD, and Google Workspace via SAML 2.0 / OIDC.
   - Just-In-Time (JIT) user provisioning and automated SCIM team seat synchronization.
2. **Cryptographically Signed Audit Trail**:
   - Audit events hashed with SHA-256 and chained into a tamper-evident audit tree.
   - Export audit logs in signed JSON format for SOC2 and ISO 27001 compliance.
3. **Emergency Break-Glass Governance Policy**:
   - Enforce two-factor authentication (2FA) verification before generating an emergency override token.
   - Trigger synchronous webhooks and email alerts to all Organization Admins upon activation.
   - Enforce a mandatory 24-hour post-incident review SLA.

## ACCEPTANCE CRITERIA
- SAML authentication flow verifies assertions correctly and assigns proper RBAC roles.
- Tamper detection test verifies that modified audit log records are immediately flagged as invalid.
- SOC2 export endpoint generates verified JSON payload with zero missing actor IDs.
