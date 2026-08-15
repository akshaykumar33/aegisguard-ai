# IDE Integration & Extension Guidelines

## VS Code, Cursor & JetBrains Integration

CodeGuard integrates with modern developer IDEs and AI coding environments.

### Local Hook Enforcement
The `.codeguard/hooks/pre-commit` and `pre-push` hooks intercept git operations triggered from:
- Terminal Git CLI
- VS Code built-in Source Control
- JetBrains Git tool window
- Cursor AI composer & agent commits
- Claude Code CLI commits
- GitHub Desktop GUI

### Diagnostic Feedback
When a secret or direct push violation occurs in an IDE, CodeGuard outputs structured error diagnostics and links to the Developer Dashboard.
