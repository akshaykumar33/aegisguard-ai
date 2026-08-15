# AI Agent Governance & Safety Constitution

This document defines the **mandatory operating rules, safety boundaries, and ethical constraints** for all AI assistants, coding agents (e.g., Claude Code, Antigravity, Cursor, GitHub Copilot, Gemini CLI, Devin), and automated subagents operating within the `aegisguard-ai` repository.

---

## 🚫 1. Absolute Attribution & Authorship Rules

### No Self-Co-Authoring
* **NEVER add `Co-authored-by: <AI-Name> <ai@example.com>`** or any AI attribution trailers to Git commit messages.
* **NEVER sign off or credit AI entities** in git commit headers, bodies, tags, or pull request descriptions unless explicitly instructed by the user.
* All commits, PRs, and code contributions belong entirely to the repository owner / human developer (`akshaykumar33`).

---

## 🛑 2. Non-Destructive Operational Guarantee

### Strict Command Whitelist & Prohibitions
* **NEVER run destructive git operations** without explicit human instruction:
  - ❌ `git reset --hard` (unless explicitly requested for a specific rollback)
  - ❌ `git clean -fdx`
  - ❌ `git branch -D` on remote or active work branches
  - ❌ Force pushing (`git push -f`) to production or shared branches without explicit approval
* **NEVER run destructive filesystem or database commands**:
  - ❌ `rm -rf` on root, src, or parent directories
  - ❌ `DROP TABLE`, `DROP DATABASE`, `TRUNCATE` against live or development databases without explicit confirmation
  - ❌ Overwriting uncommitted user changes or unversioned work without verification
* **Always run non-destructive, validating checks**:
  - ✅ `pnpm test` (Vitest)
  - ✅ `pnpm typecheck` (`tsc --noEmit` / `tsc --build`)
  - ✅ Verify clean status with `git status` after changes

---

## 🔒 3. Sensitive Data & Zero-Trust Confidentiality

### Strict Secrets & PII Protection
* **NEVER read, print, log, or display live secrets**:
  - ❌ API Keys (e.g., `GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
  - ❌ Private keys (`GITHUB_APP_PRIVATE_KEY`, SSH keys, TLS certificates)
  - ❌ Database passwords, connection strings with live credentials
  - ❌ JWT signing secrets (`JWT_SECRET`)
  - ❌ Customer PII (emails, names, billing info, card numbers)
* **Immediate Redaction**: If any sensitive string is encountered in terminal output or logs, it must be immediately redacted as `[REDACTED_SECRET]` and never persisted or echoed back.
* **Dummy Credentials Only**: All test fixtures, mocks, and documentation must use obvious synthetic placeholders (e.g. `mock-private-key`, `sk-test-dummy-key-00000000`).
* **Git Hygiene**: NEVER add `.env`, `.env.local`, `.pem`, `.key`, or credentials files to Git staging (`git add`).

---

## 🏗️ 4. Code Quality & Architectural Integrity

### Precision & Clean History
* **Granular, Atomic Commits**: Break down complex work into small, logical, sequential commits using the **Conventional Commits** specification:
  - `feat(scope): concise subject`
  - `fix(scope): concise subject`
  - `docs(scope): concise subject`
  - `chore(scope): concise subject`
* **Rich Commit Bodies**: Include high-quality multi-line bullet points explaining what changed, why, and the key components affected.
* **Preserve Documentation & Comments**: Never strip existing codebase comments, JSDoc annotations, or architecture docs unless explicitly refactoring them.
* **Token Efficiency & Anti-Hallucination**: Use `@codeguard/code-graph` (`IncrementalGraphIndexer`, `BlastRadiusAnalyzer`, `SmartContextCompactor`) to query exact symbol signatures rather than reading entire source trees needlessly.

---

## 📋 5. Summary Checklist for AI Operations

Before concluding any task or generating a response, the AI agent must verify:
- [ ] No `Co-authored-by` AI trailer was added to Git commits.
- [ ] No secrets, keys, or private environment variables were logged or exposed.
- [ ] No destructive commands were executed.
- [ ] All code changes pass TypeScript typecheck and Vitest test suites.
- [ ] Git status is clean and structured into logical commits.
