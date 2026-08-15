# CodeGuard — AI Review Engine & Verification Architecture

## 1. Hybrid Context Synthesis
The AI Reviewer receives a tightly-curated `ReviewContext` rather than the raw entire repository:
1. **Changed Files & Unified Diff**
2. **Impacted Symbols & Call Hierarchies** (Callers and Callees from Code Graph)
3. **Semantically Retrieved Chunks** via pgvector cosine similarity
4. **Active Organization Policies** and Architecture Constraints
5. **Historical Findings** on modified files/symbols

## 2. Dynamic Model Routing
- **Lightweight Model (`gpt-4o-mini` / `claude-3-5-haiku`)**: Simple formatting, documentation, README edits, low-risk diffs (< 50 lines).
- **Standard Model (`gpt-4o` / `claude-3-5-sonnet`)**: Standard business logic changes, CRUD operations, general refactoring.
- **Deep Reasoning Model (`o1` / `claude-3-7-sonnet-thinking`)**: Authentication, payment gateways, cryptography, concurrency/locking, complex distributed state changes.

## 3. High-Risk Finding Verification
Any AI-generated finding classified with `severity: CRITICAL` or `HIGH` passes through an automated verification step:
- Evidence validation against the AST/call graph.
- Second-pass verification prompt ensuring the vulnerability is demonstrable and actionable.
