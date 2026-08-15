# Pull Request Workflow & Status Check Gates

## Pull Request Lifecycle

CodeGuard orchestrates the end-to-end PR lifecycle across automated review and human approval.

```
       PR Opened / Synchronized
                  │
                  ▼
       [CodeGuard Check Run: PENDING]
                  │
                  ▼
       [Deterministic Security & SAST] ──(Fails)──▶ [Check Run: FAILED, Merge Locked]
                  │ (Passes)
                  ▼
       [Code Graph Context & AI Review] ──(Blocking Findings)──▶ [Check Run: FAILED]
                  │ (Passes)
                  ▼
       [CODEOWNERS Review Verification]
                  │
                  ▼
       [2 Human Peer Approvals (Signed)]
                  │ (Satisfied)
                  ▼
       [CodeGuard Check Run: SUCCESS] ──▶ [PR Merge Authorized]
```

### GitHub / GitLab Check Run
CodeGuard reports real-time granular statuses via the Checks API:
- `CodeGuard Security & Review`: Reports secret scanning, SAST, and AI quality evaluation.
- `CodeGuard Policy Gate`: Reports human approval counts and CODEOWNERS signoffs.
