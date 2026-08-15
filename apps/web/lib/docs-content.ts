export interface DocSection {
  id: string;
  title: string;
  items: DocItem[];
}

export interface DocItem {
  id: string;
  title: string;
  badge?: string;
  summary: string;
  content: DocContent;
}

export interface DocContent {
  lead: string;
  overview: string;
  installCommand?: {
    pnpm: string;
    npm: string;
    yarn: string;
    bun: string;
  };
  keyConcepts: { title: string; description: string }[];
  codeExamples: {
    title: string;
    description: string;
    language: string;
    filename: string;
    code: string;
  }[];
  apiReference?: {
    name: string;
    signature: string;
    description: string;
    parameters: { name: string; type: string; required: boolean; description: string }[];
    returns: string;
  }[];
  bestPractices?: string[];
  troubleshooting?: { problem: string; solution: string }[];
}

export const DOCS_DATA: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      {
        id: 'overview',
        title: 'Platform Architecture',
        badge: 'v1.4.0',
        summary: 'High-level architecture of CodeGuard AI, monorepo packages, and zero-trust AST verification engine.',
        content: {
          lead: 'CodeGuard AI is an enterprise-grade automated code review and security governance platform powered by zero-trust Abstract Syntax Tree (AST) parsing, CodeGraph symbol dependency tracing, and Google Gemini 3.7 Flash AI verification.',
          overview: 'The platform operates as a distributed monorepo consisting of lightweight micro-workers, a central Fastify API control plane, a high-performance Next.js 15 web portal, and 12 modular TypeScript packages.',
          installCommand: {
            pnpm: 'pnpm add @codeguard/cli -g',
            npm: 'npm install @codeguard/cli -g',
            yarn: 'yarn global add @codeguard/cli',
            bun: 'bun add -g @codeguard/cli',
          },
          keyConcepts: [
            {
              title: 'Multi-Stage Review Pipeline',
              description: 'Every pull request passes through 4 synchronous stages: (1) AST CodeGraph symbol mapping, (2) Shannon Entropy zero-trust secret scanning, (3) Google Gemini 3.7 Flash semantic verification, and (4) Policy Engine branch rules.',
            },
            {
              title: 'Zero Hallucination Shield',
              description: 'The AI Verifier validates LLM findings against the active AST diff and rejects any hallucinated bugs on untouched files before posting review feedback.',
            },
            {
              title: 'Break-Glass Emergency Protocol',
              description: 'Enables authorized Security Leads and Admins to bypass automated blocks during critical production incidents while recording immutable audit logs.',
            },
          ],
          codeExamples: [
            {
              title: 'End-to-End Pipeline Verification Flow',
              description: 'How a GitHub webhook event flows through the entire worker pool.',
              language: 'typescript',
              filename: 'apps/webhook-worker/src/handler.ts',
              code: `import { parseGitHubWebhook } from '@codeguard/github';
import { runSecurityScanner } from '@codeguard/security-scanner';
import { verifyWithGeminiAI } from '@codeguard/ai-reviewer';
import { evaluateBranchPolicy } from '@codeguard/policy-engine';

export async function handlePullRequestEvent(req: WebhookRequest) {
  // 1. Verify cryptographic HMAC signature
  const event = parseGitHubWebhook(req.body, req.headers['x-hub-signature-256']);
  
  // 2. Scan AST diffs for high-entropy secrets and dangerous APIs
  const scanResults = await runSecurityScanner(event.pullRequest.diff);
  if (scanResults.hasCriticalSecrets) {
    return { verdict: 'BLOCKED', reason: 'High-entropy secret pattern detected.' };
  }

  // 3. Perform semantic verification with Gemini 3.7 Flash
  const aiReview = await verifyWithGeminiAI({
    diff: event.pullRequest.diff,
    astSymbols: scanResults.symbolGraph,
    rules: event.repository.configuredPolicies,
  });

  // 4. Evaluate branch protection gates & multi-approver policies
  const policyResult = evaluateBranchPolicy(event.pullRequest, aiReview);
  return { verdict: policyResult.verdict, findings: aiReview.findings };
}`,
            },
          ],
        },
      },
      {
        id: 'quickstart',
        title: 'Quickstart & Installation',
        summary: 'Set up CodeGuard AI CLI, configure GitHub Webhooks, and run your first automated AST review in under 3 minutes.',
        content: {
          lead: 'Get up and running with CodeGuard in your local terminal or CI/CD workflow.',
          overview: 'CodeGuard CLI interacts with local git repositories, parses staged diffs, connects to the AI verification worker, and checks branch compliance policies.',
          installCommand: {
            pnpm: 'pnpm add @codeguard/cli -D',
            npm: 'npm install @codeguard/cli --save-dev',
            yarn: 'yarn add @codeguard/cli --dev',
            bun: 'bun add -d @codeguard/cli',
          },
          keyConcepts: [
            {
              title: 'API Authentication',
              description: 'Set CODEGUARD_API_KEY in your environment or run `codeguard login` to authenticate via browser OAuth.',
            },
            {
              title: 'Git Pre-Commit Hooks',
              description: 'Install pre-commit hooks to block secrets and AST policy violations before commits are pushed.',
            },
          ],
          codeExamples: [
            {
              title: 'Initialize CodeGuard in a Repository',
              description: 'Create codeguard.config.json and enable pre-commit security verification.',
              language: 'bash',
              filename: 'terminal',
              code: `# Authenticate with your enterprise workspace
codeguard login --org=acme-corp

# Initialize default security & policy configuration
codeguard init

# Run local AST security scan on staged changes
codeguard scan --staged --deep-ast

# Trigger full PR review simulation with Gemini 3.7
codeguard review pr --number=142 --model=gemini-3.7-flash`,
            },
            {
              title: 'Sample codeguard.config.json',
              description: 'Platform configuration for branch policies and AI reviewer rules.',
              language: 'json',
              filename: 'codeguard.config.json',
              code: `{
  "$schema": "https://codeguard.dev/schemas/v1/config.json",
  "version": "1.4",
  "ai": {
    "model": "gemini-3.7-flash",
    "strictMode": true,
    "confidenceThreshold": 0.85
  },
  "security": {
    "entropyScan": true,
    "blockOnCritical": true,
    "allowedSecretPatterns": ["ghp_mock_fixtures_*"]
  },
  "policy": {
    "requirePR": true,
    "minApprovals": 2,
    "enforceCodeOwners": true
  }
}`,
            },
          ],
        },
      },
    ],
  },
  {
    id: 'packages',
    title: 'Package Guides & APIs',
    items: [
      {
        id: 'security-scanner',
        title: '@codeguard/security-scanner',
        badge: 'Core',
        summary: 'Zero-trust AST vulnerability detector, Shannon entropy secret analyzer, and SAST rules engine.',
        content: {
          lead: 'Fast, deterministic AST security scanner for identifying hardcoded secrets, dangerous cryptographic usage, injection vulnerabilities, and prototype pollution.',
          overview: 'Built using Babel & TypeScript AST parsers combined with Shannon Entropy calculations to detect secrets and credentials with near-zero false positive rates.',
          installCommand: {
            pnpm: 'pnpm add @codeguard/security-scanner',
            npm: 'npm install @codeguard/security-scanner',
            yarn: 'yarn add @codeguard/security-scanner',
            bun: 'bun add @codeguard/security-scanner',
          },
          keyConcepts: [
            {
              title: 'Shannon Entropy Calculation',
              description: 'Calculates the bits of entropy per character to flag high-randomness strings (API tokens, private keys, JWT secrets).',
            },
            {
              title: 'AST Pattern Matchers',
              description: 'Identifies unsafe patterns like `eval()`, `child_process.exec()`, unparameterized SQL queries, and weak hashing algorithms (MD5/SHA1).',
            },
          ],
          codeExamples: [
            {
              title: 'Scanning Source Code in Node.js / TypeScript',
              description: 'Run the security scanner programmatically on any source file or string.',
              language: 'typescript',
              filename: 'example.ts',
              code: `import { SecurityScanner } from '@codeguard/security-scanner';

const scanner = new SecurityScanner({
  entropyThreshold: 4.2,
  rules: ['NO_EVAL', 'NO_HARDCODED_SECRETS', 'SAFE_CRYPTO_ONLY'],
});

const codeToInspect = \`
  const apiKey = "ghp_918237198273918273918273";
  eval("console.log('dangerous')");
\`;

const result = await scanner.scanCode(codeToInspect, 'src/api/auth.ts');

console.log('Passed:', result.passed);
console.log('Findings:', result.findings);
// Output: 
// [ { type: 'HIGH_ENTROPY_SECRET', line: 2, severity: 'CRITICAL' },
//   { type: 'DANGEROUS_EVAL', line: 3, severity: 'HIGH' } ]`,
            },
          ],
          apiReference: [
            {
              name: 'scanCode(code, filename, options?)',
              signature: '(code: string, filename: string, options?: ScanOptions) => Promise<ScanResult>',
              description: 'Performs AST analysis and Shannon entropy checks on source code.',
              parameters: [
                { name: 'code', type: 'string', required: true, description: 'Raw source code string.' },
                { name: 'filename', type: 'string', required: true, description: 'Target file path for AST dialect detection.' },
                { name: 'options', type: 'ScanOptions', required: false, description: 'Custom rule toggles and thresholds.' },
              ],
              returns: 'Promise<ScanResult> containing findings array, execution time, and pass/fail boolean.',
            },
          ],
        },
      },
      {
        id: 'ai-reviewer',
        title: '@codeguard/ai-reviewer',
        badge: 'Gemini 3.7',
        summary: 'Semantic PR reviewer powered by Google Gemini 3.7 Flash with multi-turn AST context reasoning.',
        content: {
          lead: 'Connects repository AST diffs with Google Gemini 3.7 Flash to discover race conditions, memory leaks, missing error handlers, and business logic flaws.',
          overview: 'The AI Reviewer structures prompt context using CodeGraph symbol call paths, minimizing token overhead while maximizing reasoning precision.',
          installCommand: {
            pnpm: 'pnpm add @codeguard/ai-reviewer',
            npm: 'npm install @codeguard/ai-reviewer',
            yarn: 'yarn add @codeguard/ai-reviewer',
            bun: 'bun add @codeguard/ai-reviewer',
          },
          keyConcepts: [
            {
              title: 'Structured JSON Schema Output',
              description: 'Gemini 3.7 Flash is constrained to return typed JSON conforming to our strict CodeGuard Review Schema.',
            },
            {
              title: 'Contextual Symbol Pruning',
              description: 'Only modified AST nodes and direct caller/callee signatures are injected into prompt context.',
            },
          ],
          codeExamples: [
            {
              title: 'Running AI Code Review Programmatically',
              description: 'Invoke Gemini 3.7 Flash on a set of changed files with symbol call context.',
              language: 'typescript',
              filename: 'ai-review-example.ts',
              code: `import { GeminiCodeReviewer } from '@codeguard/ai-reviewer';

const reviewer = new GeminiCodeReviewer({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-3.7-flash',
  temperature: 0.1, // low temperature for deterministic code analysis
});

const review = await reviewer.reviewDiff({
  repository: 'acme/payments-service',
  pullRequestNumber: 142,
  diff: \`
    + export async function chargeCustomer(id: string, amount: number) {
    +   return db.transactions.create({ data: { id, amount } });
    + }
  \`,
  contextSymbols: ['db.transactions', 'CustomerAccount'],
});

console.log('AI Verdict:', review.verdict); // 'APPROVED' | 'CHANGES_REQUESTED'
console.log('Summary:', review.summary);
console.log('Findings:', review.findings);`,
            },
          ],
        },
      },
      {
        id: 'ai-verifier',
        title: '@codeguard/ai-verifier',
        badge: 'Anti-Hallucination',
        summary: 'Verification engine that eliminates AI hallucinations by cross-checking findings against AST diff boundaries.',
        content: {
          lead: 'Prevents false positives by ensuring every AI finding maps to a valid line number and modified symbol inside the actual git diff.',
          overview: 'Any finding referencing unchanged files, nonexistent variables, or hallucinated method signatures is automatically suppressed before reaching developers.',
          installCommand: {
            pnpm: 'pnpm add @codeguard/ai-verifier',
            npm: 'npm install @codeguard/ai-verifier',
            yarn: 'yarn add @codeguard/ai-verifier',
            bun: 'bun add @codeguard/ai-verifier',
          },
          keyConcepts: [
            {
              title: 'AST Diff Bounding Check',
              description: 'Validates that `finding.lineStart` and `finding.lineEnd` fall inside git hunk additions.',
            },
            {
              title: 'Symbol Existence Proof',
              description: 'Uses CodeGraph to verify that referenced variables and imports actually exist in the AST.',
            },
          ],
          codeExamples: [
            {
              title: 'Verifying AI Findings',
              description: 'Filter hallucinated findings out of an LLM response.',
              language: 'typescript',
              filename: 'verifier.ts',
              code: `import { AIVerifier } from '@codeguard/ai-verifier';

const verifier = new AIVerifier();

const verifiedResults = verifier.verify({
  rawFindings: rawGeminiOutput.findings,
  changedFiles: ['src/token.ts'],
  hunkRanges: [{ file: 'src/token.ts', startLine: 12, endLine: 24 }],
});

console.log('Accepted findings:', verifiedResults.accepted);
console.log('Suppressed hallucinations:', verifiedResults.suppressed);`,
            },
          ],
        },
      },
      {
        id: 'code-graph',
        title: '@codeguard/code-graph',
        badge: 'AST Index',
        summary: 'Bidirectional dependency graph engine for tracing symbol imports, exports, and call hierarchies across monorepos.',
        content: {
          lead: 'Constructs an in-memory graph of all symbols, functions, classes, and type definitions across your entire monorepo.',
          overview: 'Enables instant impact analysis when a function signature changes, alerting reviewers to breaking changes in downstream packages.',
          installCommand: {
            pnpm: 'pnpm add @codeguard/code-graph',
            npm: 'npm install @codeguard/code-graph',
            yarn: 'yarn add @codeguard/code-graph',
            bun: 'bun add @codeguard/code-graph',
          },
          keyConcepts: [
            {
              title: 'Call Hierarchy Tracing',
              description: 'Traverse upstream callers and downstream dependencies in O(1) time.',
            },
            {
              title: 'Cycle Detection',
              description: 'Detects circular imports and architectural boundary violations across packages.',
            },
          ],
          codeExamples: [
            {
              title: 'Building and Querying the Symbol Graph',
              description: 'Inspect downstream callers of a modified API function.',
              language: 'typescript',
              filename: 'graph-query.ts',
              code: `import { CodeGraph } from '@codeguard/code-graph';

const graph = new CodeGraph();
await graph.indexDirectory('./packages');

const callers = graph.findCallers('verifyIncomingWebhook');
console.log('Callers across monorepo:', callers);
// Output: [ 'apps/webhook-worker/src/handler.ts:42', 'apps/api/src/middleware/auth.ts:18' ]`,
            },
          ],
        },
      },
      {
        id: 'policy-engine',
        title: '@codeguard/policy-engine',
        badge: 'Governance',
        summary: 'Deterministic branch protection rule engine, entitlement enforcer, and multi-tenant quota manager.',
        content: {
          lead: 'Enforces repository governance rules, approver minimums, security gates, and plan quotas.',
          overview: 'Evaluates PR metadata and review findings against organization policy rules to produce a definitive gate decision: PASS, BLOCK, or BREAK_GLASS_REQUIRED.',
          installCommand: {
            pnpm: 'pnpm add @codeguard/policy-engine',
            npm: 'npm install @codeguard/policy-engine',
            yarn: 'yarn add @codeguard/policy-engine',
            bun: 'bun add @codeguard/policy-engine',
          },
          keyConcepts: [
            {
              title: 'Tiered Gate Decisions',
              description: 'Non-blocking warnings vs hard PR blocking on CRITICAL security severity findings.',
            },
            {
              title: 'Entitlement Quota Guard',
              description: 'Tracks monthly review consumption per organization and triggers warning threshold alerts at 80% and 100%.',
            },
          ],
          codeExamples: [
            {
              title: 'Evaluating Branch Rules',
              description: 'Determine if a pull request can merge.',
              language: 'typescript',
              filename: 'policy.ts',
              code: `import { PolicyEngine } from '@codeguard/policy-engine';

const engine = new PolicyEngine();

const decision = engine.evaluate({
  pullRequest: { baseBranch: 'main', approvalsCount: 1 },
  findings: [{ severity: 'CRITICAL', title: 'SQL Injection in /api/v1/users' }],
  policy: {
    minApprovals: 2,
    blockOnCritical: true,
  },
});

console.log('Decision:', decision.status); // 'BLOCKED'
console.log('Violations:', decision.violations);
// [ 'Requires minimum 2 approvals (got 1)', 'Critical severity finding blocks merge' ]`,
            },
          ],
        },
      },
      {
        id: 'cli',
        title: '@codeguard/cli',
        badge: 'Developer Tool',
        summary: 'Command-line interface for local developer workflows, git hooks, CI/CD runners, and offline security scans.',
        content: {
          lead: 'Bring CodeGuard directly into your terminal, pre-commit hooks, and CI/CD pipelines (GitHub Actions, GitLab CI, CircleCI).',
          overview: 'Features interactive colorized terminal outputs, JSON formatters, and exit code handling suitable for automated scripts.',
          installCommand: {
            pnpm: 'pnpm add -g @codeguard/cli',
            npm: 'npm install -g @codeguard/cli',
            yarn: 'yarn global add @codeguard/cli',
            bun: 'bun add -g @codeguard/cli',
          },
          keyConcepts: [
            {
              title: 'CI Exit Codes',
              description: 'Exits with code 0 on clean review, code 1 on policy/security blocks, and code 2 on network/config errors.',
            },
            {
              title: 'GitHub Actions Integration',
              description: 'Automate PR checks with zero-config GitHub Actions step.',
            },
          ],
          codeExamples: [
            {
              title: 'GitHub Actions Workflow Example',
              description: 'Run CodeGuard on every opened and synchronized pull request.',
              language: 'yaml',
              filename: '.github/workflows/codeguard.yml',
              code: `name: CodeGuard Security & AI Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Run CodeGuard Review
        env:
          CODEGUARD_API_KEY: \${{ secrets.CODEGUARD_API_KEY }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: |
          npx @codeguard/cli review pr --ci --fail-on=CRITICAL`,
            },
          ],
        },
      },
    ],
  },
  {
    id: 'guides',
    title: 'Workflows & Tutorials',
    items: [
      {
        id: 'zero-trust-secrets',
        title: 'Zero-Trust Secret Prevention Guide',
        summary: 'How CodeGuard detects, calculates entropy, and prevents leaks of API tokens, SSH keys, and cloud credentials.',
        content: {
          lead: 'Learn how our dual Shannon Entropy and regex pattern scanner blocks secrets before they enter git history.',
          overview: 'Traditional regex scanners miss novel tokens or generate noisy false positives. CodeGuard combines high-entropy mathematical analysis with AST node inspection to verify credentials with certainty.',
          keyConcepts: [
            {
              title: 'Shannon Entropy Formula',
              description: 'H(X) = -sum(P(x_i) * log2(P(x_i))). Strings with H(X) > 4.5 and length > 20 are analyzed for secret patterns.',
            },
            {
              title: 'Test Fixture Whitelisting',
              description: 'Allows configured test mock files to bypass false alerts using `# codeguard-ignore` inline directives.',
            },
          ],
          codeExamples: [
            {
              title: 'Inline Ignore Annotations',
              description: 'Whitelisting legitimate mock credentials in unit test fixtures.',
              language: 'typescript',
              filename: 'tests/fixtures/mock-auth.ts',
              code: `// codeguard-ignore-next-line HIGH_ENTROPY_SECRET
export const MOCK_STRIPE_TEST_SECRET = 'sk_test_51MzXXXXX992819827312';

// codeguard-ignore-start
export const MOCK_JWT_FIXTURES = {
  tokenA: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  tokenB: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};
// codeguard-ignore-end`,
            },
          ],
        },
      },
      {
        id: 'break-glass',
        title: 'Emergency Break-Glass Protocol',
        summary: 'Procedure and governance for bypassing automated blocks during production P0/P1 incident hotfixes.',
        content: {
          lead: 'During live production outages, authorized security engineers can activate a Break-Glass Override to push emergency remediation.',
          overview: 'All Break-Glass activations require mandatory justification, two-factor authentication, generate high-priority security notifications, and are signed into an immutable audit trail.',
          keyConcepts: [
            {
              title: 'RBAC Access Gate',
              description: 'Only users with the `SECURITY_LEAD` or `ADMIN` role are permitted to request Break-Glass bypass.',
            },
            {
              title: '24-Hour SLA Audit Policy',
              description: 'Requires a post-incident security review and signed remediation commit within 24 hours of bypass activation.',
            },
          ],
          codeExamples: [
            {
              title: 'Triggering Break-Glass via CLI',
              description: 'Execute emergency bypass from the command line with justification.',
              language: 'bash',
              filename: 'terminal',
              code: `codeguard override pr --number=142 \\
  --reason="Production payment gateway failover P0 hotfix INC-991" \\
  --approver="security-lead@codeguard.dev" \\
  --confirm-immutable-audit`,
            },
          ],
        },
      },
    ],
  },
];
