# PHASE 5 PROMPT: Multi-Model AI Gateway (Google Gemini 3.7 + AWS Bedrock)

## ROLE
Act as a **Staff AI/ML Systems Engineer & Cloud Architect**.

## CONTEXT
You are implementing an enterprise-grade AI Gateway inside `@codeguard/ai-reviewer` that seamlessly orchestrates **Google Gemini 3.7 Flash** (primary) and **AWS Bedrock (Claude 3.5 Sonnet / Llama 3.3)** as an enterprise failover.

## TARGET ARCHITECTURE
```text
                 ┌──────────────────────────┐
                 │    CodeGuard AI Gateway  │
                 └────────────┬─────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
   ┌───────────────────────┐     ┌───────────────────────┐
   │ Google Gemini 3.7 API │     │ AWS Bedrock (Claude)  │
   │  (Default Low-Latency)│     │  (Enterprise Failover)│
   └───────────────────────┘     └───────────────────────┘
```

## INSTRUCTIONS
1. Define a generic `AIReviewerProvider` interface in `packages/ai-reviewer/src/provider.ts`:
   ```typescript
   export interface AIReviewerProvider {
     name: string;
     reviewDiff(request: ReviewRequest): Promise<ReviewResult>;
     healthCheck(): Promise<boolean>;
   }
   ```
2. Implement `GeminiProvider` using `@google/genai` with strict JSON schema constraints.
3. Implement `BedrockProvider` using `@aws-sdk/client-bedrock-runtime` with Converse API.
4. Implement automatic failover and exponential backoff retry logic:
   - If Gemini API encounters HTTP 429 / 503, failover to Bedrock Claude 3.5 Sonnet transparently.
   - Record token consumption, model used, and latency metrics in the review audit record.
5. Ensure prompt context sanitization trims AST nodes to avoid prompt injection attacks from malicious repository pull requests.

## ACCEPTANCE CRITERIA
- Unit tests verify fallback from primary provider to secondary provider upon simulated error.
- All AI outputs conform strictly to the CodeGuard Review JSON schema.
- Zero credential leakage in prompt logs.
