# Code Graph & Call Hierarchy Retrieval

## Repository Knowledge Graph

CodeGuard constructs an in-memory graph connecting symbols, calls, and file boundaries across the codebase.

```
┌─────────────────────────────────┐
│     POST /api/v1/payments       │
└─────────────────────────────────┘
                 │ calls
                 ▼
┌─────────────────────────────────┐
│    PaymentService.charge()      │
└─────────────────────────────────┘
                 │ references
                 ▼
┌─────────────────────────────────┐
│      StripeGatewayClient        │
└─────────────────────────────────┘
```

### Retrieval & Hybrid Ranking
When reviewing a PR modifying `PaymentService.charge()`, the `HybridRetriever`:
1. Discovers direct callers (`PaymentController`).
2. Discovers direct callees (`StripeGatewayClient`, `LedgerRepository`).
3. Assembles minimal, token-efficient context snippets included in the LLM prompt, ensuring the AI model has full cross-module context.
