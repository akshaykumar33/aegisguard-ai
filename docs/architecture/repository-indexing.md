# CodeGuard — Repository Indexing & Code Graph Architecture

## 1. Multi-Layer Intelligence Graph
CodeGuard constructs a persistent graph representing the structural semantics of the codebase:
- **Nodes**: Repository, File, Module, Class, Interface, Function, Method, API Endpoint, Database Table, Dependency.
- **Edges**: `IMPORTS`, `CALLS`, `EXTENDS`, `IMPLEMENTS`, `USES`, `READS`, `WRITES`, `EXPOSES`, `DEFINED_IN`, `TESTED_BY`.

```text
Controller (File: routes/user.ts)
   │
   ▼ CALLS
UserService (File: services/user.ts)
   │
   ▼ CALLS
UserRepository (File: db/user.ts)
   │
   ▼ WRITES
UsersTable (Postgres Table: users)
```

## 2. Incremental Parsing & Vectorization
- When a PR modifies `k` files, only those `k` files are re-parsed and updated in the code graph.
- Unchanged symbols and relationships retain their existing IDs and embeddings.
- Full re-indexing occurs only during initial repository connection or scheduled integrity checks.
