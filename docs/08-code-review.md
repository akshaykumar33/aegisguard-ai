# Code Review Pipeline & Standards

## Multi-Dimensional Automated Code Review

CodeGuard executes a 5-tier review pipeline for every pull request opened or synchronized in the organization.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          STAGE 1: PARSING & DIFFING                         │
│  - Unified Diff Parsing with per-hunk line mapping                          │
│  - Extraction of added, modified, deleted lines and files                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  STAGE 2: DETERMINISTIC SECURITY & SAST                     │
│  - Secret Scanner: 22+ API/Token patterns, Shannon entropy heuristics       │
│  - Sensitive Data: Credit cards (Luhn validated), SSNs, internal hostnames  │
│  - Static Analysis: SQLi, Command Injection, Path Traversal, eval()        │
│  - Dependency Scanner: CVE vulnerability matching in manifests              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                STAGE 3: CODE GRAPH & CONTEXTUAL RETRIEVAL                   │
│  - Tree-sitter AST symbol & definition extraction                           │
│  - Repository call graph & cross-file reference assembly                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               STAGE 4: GROUNDED AI REVIEW WITH PROMPT DEFENSE               │
│  - XML encapsulation (<untrusted_repository_code>) against prompt injection │
│  - Strict Zod schema output formatting                                      │
│  - 1-Click exact replacement code suggestions                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               STAGE 5: HALLUCINATION VERIFICATION & PUBLISHING              │
│  - Verification of line numbers & syntax against diff boundaries            │
│  - Suppression of hallucinated issues on unchanged files                    │
│  - Publication of sticky summary comment & GitHub Check Run status          │
└─────────────────────────────────────────────────────────────────────────────┘
```
