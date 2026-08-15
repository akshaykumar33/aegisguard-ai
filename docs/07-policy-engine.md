# Central Policy Engine & Policy-as-Code

## Policy Engine Architecture

CodeGuard's `PolicyEngine` evaluates incoming pull requests, commits, and branch operations against hierarchical organization and repository policies.

```
┌─────────────────────────────────────────────────────────────┐
│                 ORGANIZATION ROOT POLICY                    │
│   - Required Approvals: >= 2                                │
│   - Secret Blocking: MANDATORY (Zero-Tolerance)             │
│   - Critical SAST Blocking: MANDATORY                       │
│   - CODEOWNERS: MANDATORY                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ Inherits & Can ONLY Strengthen
┌─────────────────────────────────────────────────────────────┐
│                 REPOSITORY OVERRIDE POLICY                  │
│   - Stricter Branch Rules                                   │
│   - Custom Architecture Boundaries                          │
└─────────────────────────────────────────────────────────────┘
```

### Policy Actions
- `ALLOW`: The check passed with no warnings or blocking issues.
- `WARN`: Advisory finding; displayed in PR review comments but does not block merging.
- `REQUIRE_APPROVAL`: Requires explicit senior / security lead review signoff.
- `BLOCK`: Pull request merge gate is locked. The PR cannot be merged until the issue is fixed.

### Cryptographic Policy Signing & Verification
- Organization policies are signed using HMAC-SHA256:
  `PolicyEngine.signPolicy(policy, secretKey, keyId, expiresInSeconds)`
- Workstations and CI systems verify the digital signature using:
  `PolicyEngine.verifySignedPolicy(signedPolicy, secretKey)`
- Tampered or expired policies are rejected automatically.
