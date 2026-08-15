# Grounded AI Code Review & Prompt Injection Defense

## Architecture of the AI Review Engine

CodeGuard provides deep, grounded AI code reviews using Google Gemini 2.5 Pro / Flash models with enterprise prompt injection defenses.

### Prompt Injection Defenses
1. **Untrusted Code Boundaries**: Untrusted source code diffs are wrapped inside XML tags `<untrusted_repository_code>`.
2. **System Prompt Isolation**: The system prompt explicitly instructs the LLM that code comments and diff strings are untrusted data, preventing adversarial jailbreak attempts.
3. **Structured Schema Validation**: All responses are parsed and strictly validated against Zod schemas (`aiReviewResponseSchema`), rejecting non-conforming responses.

### 1-Click Code Suggestions
For every finding in modified lines, CodeGuard generates concrete, drop-in replacement snippets compatible with GitHub and GitLab 1-click apply:
```json
{
  "title": "Unsanitized Path Traversal in File Loader",
  "category": "SECURITY",
  "severity": "CRITICAL",
  "filePath": "src/utils/fileLoader.ts",
  "startLine": 45,
  "endLine": 45,
  "suggestion": "const safePath = path.resolve(BASE_DIR, path.basename(userInput));"
}
```
