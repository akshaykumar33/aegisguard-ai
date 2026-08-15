# Git Workflow & Standard Operating Procedures

## Enterprise Branching Strategy

CodeGuard enforces structured Git workflows across all repositories.

```
       feat/auth-service-v2           (AI or Human Developer)
           ○───○───○
          /         \  (Pull Request, Deterministic Scans, AI Review, CODEOWNERS, 2 Humans)
main ────○───────────●────────────────○ (Direct pushes strictly blocked by CodeGuard)
          \                          /
           ○───○────────────────────○
       fix/session-timeout
```

### 1. Branch Naming Conventions
All non-default branches must conform to organizational naming standards:
- `feature/<name>` or `feat/<name>`: New capabilities or functional enhancements
- `fix/<name>` or `bugfix/<name>`: Defect repairs
- `hotfix/<name>`: Emergency production incident remediation
- `chore/<name>`: Dependency updates, CI/CD pipeline modifications
- `docs/<name>`: Documentation improvements
- `refactor/<name>`: Code restructuring without functional behavior changes

### 2. Conventional Commit Standards
All commit messages must adhere to the Conventional Commits specification:
```
<type>(<optional-scope>): <description>

[optional body]

[optional footer(s)]
```
Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

### 3. Machine vs. Human Authorship
Commits authored by automated AI agents (`Claude Code`, `Cursor`, `Codex`, `Copilot`) must carry clear machine identity attribution (`ActorType: AI_AGENT`). AI agents are bound to the exact same branch and PR workflow.
