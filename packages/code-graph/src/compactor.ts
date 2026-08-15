import type { GraphNode, TokenBudgetConfig, CompactGraphContextResult, BlastRadiusReport } from './types.js';
import type { CodeGraphStore } from './store.js';
import { BlastRadiusAnalyzer } from './blastRadius.js';

export class SmartContextCompactor {
  private store: CodeGraphStore;
  private analyzer: BlastRadiusAnalyzer;

  constructor(store: CodeGraphStore) {
    this.store = store;
    this.analyzer = new BlastRadiusAnalyzer(store);
  }

  /**
   * Generate token-compacted, anti-hallucination graph context for an AI prompt
   */
  generatePromptContext(
    changedSymbolIds: string[],
    config?: TokenBudgetConfig
  ): CompactGraphContextResult {
    const maxTokens = config?.maxTokens || 2500;
    const includeSignatures = config?.includeSignatures !== false;
    const includeDocstrings = config?.includeDocstrings !== false;
    const includeCallChains = config?.includeCallChains !== false;
    const maxCallersPerSymbol = config?.maxCallersPerSymbol || 5;

    const report: BlastRadiusReport = this.analyzer.analyze(changedSymbolIds);
    const sections: string[] = [];

    // Header & Blast Radius Summary
    sections.push(`### 🛡️ CodeGraph Blast Radius & Architecture Context:`);
    sections.push(`- **Risk Score**: ${report.riskScore}/100 (Dependency Depth: ${report.dependencyDepth} hops, Affected Nodes: ${report.totalAffectedNodes})`);
    if (report.riskFactors.length > 0) {
      sections.push(`- **Risk Factors**: ${report.riskFactors.join(' | ')}`);
    }
    if (report.impactedTestFiles.length > 0) {
      sections.push(`- **Covering Tests**: ${report.impactedTestFiles.map((t) => `\`${t}\``).join(', ')}`);
    }

    // 1. Changed Symbols (High Priority)
    sections.push(`\n#### 📌 Modified Symbol Contracts:`);
    for (const node of report.changedSymbols) {
      let symLine = `- \`${node.kind}\` **${node.name}** in \`${node.filePath}:${node.startLine}-${node.endLine}\``;
      if (includeSignatures && node.signature) {
        symLine += `\n  - Signature: \`${node.signature}\``;
      }
      if (includeDocstrings && node.docstring) {
        symLine += `\n  - Docstring: _${node.docstring}_`;
      }
      sections.push(symLine);
    }

    // 2. Call Graph Relationships (Callers & Callees)
    if (includeCallChains) {
      sections.push(`\n#### 🔗 Cross-File Call Graph & Caller Impact:`);
      for (const node of report.changedSymbols) {
        const callers = this.store.findCallers(node.id).slice(0, maxCallersPerSymbol);
        const callees = this.store.findCallees(node.id).slice(0, maxCallersPerSymbol);

        if (callers.length > 0) {
          const callerNames = callers.map((c) => `\`${c.caller.name}\` (${c.caller.filePath}:${c.caller.startLine})`).join(', ');
          sections.push(`  * **${node.name}** is CALLED BY: ${callerNames}`);
        }

        if (callees.length > 0) {
          const calleeNames = callees.map((c) => `\`${c.callee.name}\` (${c.callee.filePath}:${c.callee.startLine})`).join(', ');
          sections.push(`  * **${node.name}** INVOKES: ${calleeNames}`);
        }
      }
    }

    // 3. Transitive Callers (Lower priority, budget-checked)
    if (report.transitiveCallers.length > 0) {
      const topTransitive = report.transitiveCallers.slice(0, 5);
      sections.push(`\n#### ⚡ Upstream Transitive Callers:`);
      for (const trans of topTransitive) {
        sections.push(`  - \`${trans.name}\` (${trans.filePath}:${trans.startLine})`);
      }
    }

    let fullText = sections.join('\n');
    let estimatedTokens = Math.ceil(fullText.length / 4);
    let truncated = false;

    // Enforce token budget limit
    if (estimatedTokens > maxTokens) {
      const charLimit = maxTokens * 4;
      fullText = fullText.slice(0, charLimit) + '\n\n[... Remaining context truncated to preserve token budget ...]';
      estimatedTokens = maxTokens;
      truncated = true;
    }

    return {
      formattedContext: fullText,
      estimatedTokens,
      totalSymbolsIncluded: report.changedSymbols.length + report.directCallers.length,
      blastRadiusScore: report.riskScore,
      truncated
    };
  }
}
