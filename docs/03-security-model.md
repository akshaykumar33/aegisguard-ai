# CodeGuard Security Model & Zero-Trust Architecture

## Defense-in-Depth Model

The CodeGuard security model is built on four non-negotiable architectural tenets:

1. **Authoritative Server Rule**:
   Client-side tools (Git CLI hooks, VS Code extension, local linters, AI agent instructions) exist solely for Developer Experience (DX) and immediate developer feedback. **No client-side check is ever trusted by the server.** All security decisions, policy enforcement, and merge validations occur exclusively on the CodeGuard Control Plane.

2. **Mandatory Human Peer Approvals**:
   AI reviews are classified strictly as advisory / quality gates (`AI_REVIEW`). An AI approval **can never** replace, count toward, or substitute for a human peer review (`HUMAN_REVIEW`). Branch policies require minimum $N$ human peer approvals (default: 2).

3. **Untrusted AI Agent Contribution Model**:
   Commits or pull requests authored by autonomous AI coding agents (Cursor, Claude Code, Codex, Devin, automated copilot bots) are treated with the exact same zero-trust rigor as unauthenticated external contributors. Direct pushes by AI bots to protected branches are unconditionally blocked by the server-side branch protection gate.

4. **Cryptographic Policy Verification & Tamper Defense**:
   Policies distributed to the CLI or cached on workstations are HMAC-SHA256 digitally signed by the organization's master key. Any local tampering of rules immediately invalidates the signature and causes the CLI to halt execution and re-sync with the central control plane.
