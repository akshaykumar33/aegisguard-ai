import type { GraphNode, BlastRadiusReport } from './types.js';
import type { CodeGraphStore } from './store.js';

export interface BlastRadiusOptions {
  maxDepth?: number;
  testFilePatterns?: RegExp[];
  criticalFilePatterns?: RegExp[];
}

export class BlastRadiusAnalyzer {
  private store: CodeGraphStore;
  private options: Required<BlastRadiusOptions>;

  constructor(store: CodeGraphStore, options?: BlastRadiusOptions) {
    this.store = store;
    this.options = {
      maxDepth: options?.maxDepth || 3,
      testFilePatterns: options?.testFilePatterns || [
        /\.test\.[jt]sx?$/,
        /\.spec\.[jt]sx?$/,
        /__tests__\//,
        /tests?\//,
        /test_[a-zA-Z0-9_]+\.py$/
      ],
      criticalFilePatterns: options?.criticalFilePatterns || [
        /auth/i,
        /security/i,
        /billing/i,
        /payment/i,
        /database|db|schema/i,
        /session/i,
        /crypto/i,
        /permission|rbac/i
      ]
    };
  }

  /**
   * Analyze blast radius and downstream impact for a set of changed symbol IDs
   */
  analyze(changedSymbolIds: string[]): BlastRadiusReport {
    const changedNodes: GraphNode[] = [];
    const directCallersMap = new Map<string, GraphNode>();
    const transitiveCallersMap = new Map<string, GraphNode>();
    const impactedTestFiles = new Set<string>();
    const riskFactors: string[] = [];

    for (const id of changedSymbolIds) {
      const node = this.store.getNode(id);
      if (node) {
        changedNodes.push(node);
      }
    }

    // 1. Direct callers (Depth = 1)
    for (const changedNode of changedNodes) {
      const direct = this.store.findCallers(changedNode.id);
      for (const { caller } of direct) {
        if (!changedSymbolIds.includes(caller.id)) {
          directCallersMap.set(caller.id, caller);
          if (this.isTestFile(caller.filePath)) {
            impactedTestFiles.add(caller.filePath);
          }
        }
      }
    }

    // 2. Transitive callers (Depth 2 to maxDepth)
    let currentLevelNodes = Array.from(directCallersMap.values());
    let depthReached = directCallersMap.size > 0 ? 1 : 0;

    for (let d = 2; d <= this.options.maxDepth; d++) {
      const nextLevel: GraphNode[] = [];
      for (const node of currentLevelNodes) {
        const upstream = this.store.findCallers(node.id);
        for (const { caller } of upstream) {
          if (
            !changedSymbolIds.includes(caller.id) &&
            !directCallersMap.has(caller.id) &&
            !transitiveCallersMap.has(caller.id)
          ) {
            transitiveCallersMap.set(caller.id, caller);
            nextLevel.push(caller);
            if (this.isTestFile(caller.filePath)) {
              impactedTestFiles.add(caller.filePath);
            }
          }
        }
      }
      if (nextLevel.length > 0) {
        depthReached = d;
      }
      currentLevelNodes = nextLevel;
    }

    // 3. Risk Calculation
    let riskScore = 10; // Baseline

    // Check critical file modifications
    const touchedCriticalFiles = changedNodes.filter((n) =>
      this.options.criticalFilePatterns.some((pattern) => pattern.test(n.filePath))
    );
    if (touchedCriticalFiles.length > 0) {
      riskScore += 30;
      riskFactors.push(`Modifies critical domain files (${touchedCriticalFiles.map((n) => n.name).join(', ')})`);
    }

    // High caller fanout
    const totalCallers = directCallersMap.size + transitiveCallersMap.size;
    if (totalCallers > 10) {
      riskScore += 30;
      riskFactors.push(`High downstream caller fanout (${totalCallers} callers affected)`);
    } else if (totalCallers > 3) {
      riskScore += 15;
      riskFactors.push(`Moderate caller fanout (${totalCallers} callers affected)`);
    }

    // Deep call hierarchy
    if (depthReached >= 3) {
      riskScore += 15;
      riskFactors.push(`Deep transitive dependency chain (${depthReached} hops)`);
    }

    // Test coverage assessment
    if (impactedTestFiles.size === 0 && totalCallers > 0) {
      riskScore += 15;
      riskFactors.push('No direct unit test suites detected calling modified symbols');
    } else if (impactedTestFiles.size > 0) {
      riskScore -= 10; // Bonus for having test coverage
      riskFactors.push(`Verified ${impactedTestFiles.size} matching test suite(s) covering changed code`);
    }

    // Clamp score between 0 and 100
    riskScore = Math.max(5, Math.min(100, riskScore));

    return {
      changedSymbols: changedNodes,
      directCallers: Array.from(directCallersMap.values()),
      transitiveCallers: Array.from(transitiveCallersMap.values()),
      impactedTestFiles: Array.from(impactedTestFiles),
      totalAffectedNodes: changedNodes.length + directCallersMap.size + transitiveCallersMap.size,
      riskScore,
      riskFactors,
      dependencyDepth: depthReached
    };
  }

  private isTestFile(filePath: string): boolean {
    return this.options.testFilePatterns.some((pattern) => pattern.test(filePath));
  }
}
