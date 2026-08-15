import { describe, it, expect } from 'vitest';
import { HybridRetriever } from './index.js';
import { CodeGraphStore } from '@codeguard/code-graph';

describe('Hybrid Context Retriever', () => {
  it('should assemble structured review context with call graphs and policies', () => {
    const graph = new CodeGraphStore();
    graph.addNode({
      id: 'n-1',
      name: 'chargeCreditCard',
      kind: 'FUNCTION',
      filePath: 'src/billing.ts',
      startLine: 10,
      endLine: 40
    });
    graph.addNode({
      id: 'n-2',
      name: 'handleCheckout',
      kind: 'FUNCTION',
      filePath: 'src/checkout.ts',
      startLine: 5,
      endLine: 25
    });

    graph.addEdge({
      sourceId: 'n-2',
      targetId: 'n-1',
      relationType: 'CALLS'
    });

    const changedFiles = [{ path: 'src/billing.ts', status: 'modified', additions: 10, deletions: 2 }];
    const changedSymbols = [
      {
        name: 'chargeCreditCard',
        kind: 'FUNCTION' as const,
        filePath: 'src/billing.ts',
        startLine: 10,
        endLine: 40,
        contentHash: 'hash123'
      }
    ];

    const policies = [
      {
        id: 'p-1',
        organizationId: 'org-1',
        name: 'PCI-DSS Compliance',
        isDefault: true,
        enabled: true,
        rules: [
          {
            id: 'r-1',
            policyId: 'p-1',
            name: 'No Card Number In Logs',
            ruleType: 'SECRET_BLOCK' as const,
            condition: {},
            action: 'BLOCK' as const,
            enabled: true
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const context = HybridRetriever.assembleContext(changedFiles, changedSymbols, graph, policies);

    expect(context.changedFiles.length).toBe(1);
    expect(context.changedSymbols.length).toBe(1);
    expect(context.callGraphContext.callers.length).toBe(1);
    expect(context.callGraphContext.callers[0].callers[0].name).toBe('handleCheckout');
    expect(context.formattedPromptContext).toContain('chargeCreditCard');
    expect(context.formattedPromptContext).toContain('PCI-DSS Compliance');
  });
});
