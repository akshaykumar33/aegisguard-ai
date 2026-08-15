import { describe, it, expect } from 'vitest';
import { parseUnifiedDiff } from '@codeguard/code-parser';
import { securityOrchestrator } from '@codeguard/security-scanner';
import { PolicyEngine } from '@codeguard/policy-engine';

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
