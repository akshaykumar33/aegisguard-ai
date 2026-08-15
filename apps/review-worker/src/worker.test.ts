import { describe, it, expect } from 'vitest';
import { parseUnifiedDiff } from '@codeguard/code-parser';
import { securityOrchestrator } from '@codeguard/security-scanner';
import { PolicyEngine } from '@codeguard/policy-engine';
import { IncrementalGraphIndexer } from '@codeguard/code-graph';
import { reconstructPostImage, formatBlastRadiusSummary } from './processor.js';

describe('Review Pipeline Worker Orchestration Unit Tests', () => {
  it('should parse diff and detect secrets and blocking policy in worker pipeline', () => {
    const rawDiff = `
diff --git a/src/secrets.ts b/src/secrets.ts
new file mode 100644
--- /dev/null
+++ b/src/secrets.ts
@@ -0,0 +1,3 @@
+export const apiKey = "AKIAIOSFODNN7EXAMPLE";
+export const gemini = "AIzaSyD1234567890abcdefghijklmnopqr";
    `;

    const parsed = parseUnifiedDiff(rawDiff);
    expect(parsed.files.length).toBe(1);

    const filesToScan = parsed.files.map((f) => ({
      filePath: f.newPath,
      content: f.hunks.flatMap((h) => h.lines.map((l) => l.content)).join('\n')
    }));

    const findings = securityOrchestrator.scanFiles(filesToScan, 'org-1', 'repo-1');
    expect(findings.length).toBeGreaterThanOrEqual(2);
    expect(findings[0].category).toBe('SECRET');

    const defaultPolicy = {
      id: 'p-1',
      organizationId: 'org-1',
      name: 'Default Policy',
      version: '1.0.0',
      level: 'ORGANIZATION' as const,
      isDefault: true,
      enabled: true,
      rules: [
        {
          id: 'r-1',
          policyId: 'p-1',
          name: 'Block Secrets',
          ruleType: 'SECRET_BLOCK' as const,
          condition: {},
          action: 'BLOCK' as const,
          enabled: true
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const policyOutcome = PolicyEngine.evaluate(defaultPolicy, findings);
    expect(policyOutcome.outcome).toBe('BLOCK');
    expect(policyOutcome.blockingFindingIds.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Diff post-image reconstruction', () => {
  it('excludes deleted lines so removing a secret does not report one', () => {
    const rawDiff = `
diff --git a/src/config.ts b/src/config.ts
--- a/src/config.ts
+++ b/src/config.ts
@@ -1,3 +1,3 @@
 const region = "us-east-1";
-const apiKey = "AKIAIOSFODNN7EXAMPLE";
+const apiKey = process.env.AWS_ACCESS_KEY_ID;
`;

    const parsed = parseUnifiedDiff(rawDiff);
    const content = reconstructPostImage(parsed.files[0]);

    expect(content).toContain('process.env.AWS_ACCESS_KEY_ID');
    expect(content).not.toContain('AKIAIOSFODNN7EXAMPLE');

    // The PR removes the hardcoded key, so the scanner must not block it.
    const findings = securityOrchestrator.scanFiles(
      [{ filePath: parsed.files[0].newPath, content }],
      'org-1',
      'repo-1'
    );
    expect(findings.filter((f) => f.evidence?.includes('AKIAIOSFODNN7EXAMPLE'))).toHaveLength(0);
  });

  it('places each line at its real file line number', () => {
    const rawDiff = `
diff --git a/src/app.ts b/src/app.ts
--- a/src/app.ts
+++ b/src/app.ts
@@ -10,3 +10,4 @@
 function start() {
+  const token = "AIzaSyD1234567890abcdefghijklmnopqr";
   return true;
 }
`;

    const parsed = parseUnifiedDiff(rawDiff);
    const content = reconstructPostImage(parsed.files[0]);
    const lines = content.split('\n');

    // The hunk starts at line 10, so 'function start()' must land on line 10.
    expect(lines[9]).toContain('function start()');

    const findings = securityOrchestrator.scanFiles(
      [{ filePath: parsed.files[0].newPath, content }],
      'org-1',
      'repo-1'
    );
    const secret = findings.find((f) => f.category === 'SECRET');
    expect(secret).toBeDefined();
    // Line 11 in the real file, not position 2 within the concatenated hunk.
    expect(secret!.startLine).toBe(11);
  });
});

describe('Code graph population', () => {
  it('indexes changed files and links cross-file calls', () => {
    const files = [
      {
        filePath: 'src/service.ts',
        content: 'export function chargeCard(amount: number) {\n  return amount;\n}\n'
      },
      {
        filePath: 'src/handler.ts',
        content:
          "import { chargeCard } from './service.js';\n\nexport function handlePayment() {\n  return chargeCard(100);\n}\n"
      }
    ];

    const indexer = new IncrementalGraphIndexer();
    const result = indexer.indexFilesInMemory(files);
    const store = indexer.getStore();

    expect(result.totalSymbols).toBeGreaterThan(0);

    // The pipeline previously handed an empty store to the retriever, so this
    // lookup returned nothing no matter what changed.
    const [chargeCardNode] = store.findNodesByName('chargeCard');
    expect(chargeCardNode).toBeDefined();
    expect(store.findCallers(chargeCardNode.id).length).toBeGreaterThan(0);
  });
});

describe('Blast radius summary rendering', () => {
  it('omits the section when nothing downstream is affected', () => {
    expect(formatBlastRadiusSummary(undefined)).toBeUndefined();
    expect(
      formatBlastRadiusSummary({
        changedSymbols: [],
        directCallers: [],
        transitiveCallers: [],
        impactedTestFiles: [],
        totalAffectedNodes: 0,
        riskScore: 0,
        riskFactors: [],
        dependencyDepth: 0
      })
    ).toBeUndefined();
  });

  it('renders risk score and factors when impact exists', () => {
    const summary = formatBlastRadiusSummary({
      changedSymbols: [],
      directCallers: [],
      transitiveCallers: [],
      impactedTestFiles: ['src/payments.test.ts'],
      totalAffectedNodes: 4,
      riskScore: 72,
      riskFactors: ['Touches payment authorisation path'],
      dependencyDepth: 3
    });

    expect(summary).toContain('72/100');
    expect(summary).toContain('Touches payment authorisation path');
    expect(summary).toContain('src/payments.test.ts');
  });
});
