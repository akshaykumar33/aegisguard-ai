import type { CodeGraphStore, GraphNode, BlastRadiusReport } from '@codeguard/code-graph';
import { SmartContextCompactor, BlastRadiusAnalyzer } from '@codeguard/code-graph';
import type { ExtractedSymbol } from '@codeguard/code-parser';
import type { Finding, Policy } from '@codeguard/types';

export interface AssembledReviewContext {
  changedFiles: { path: string; status: string; additions: number; deletions: number }[];
  changedSymbols: ExtractedSymbol[];
  callGraphContext: {
    callers: { target: string; callers: GraphNode[] }[];
    callees: { source: string; callees: GraphNode[] }[];
  };
  blastRadiusReport?: BlastRadiusReport;
  historicalFindings: Finding[];
  activePolicies: Policy[];
  formattedPromptContext: string;
  estimatedTokens: number;
}

export class HybridRetriever {
  /**
   * Assemble structured review context for AI reviewer with token-budgeted smart compaction
   */
  static assembleContext(
    changedFiles: { path: string; status: string; additions: number; deletions: number }[],
    changedSymbols: ExtractedSymbol[],
    graphStore: CodeGraphStore,
    activePolicies: Policy[],
    historicalFindings: Finding[] = [],
    maxTokens: number = 3000
  ): AssembledReviewContext {
    const callersContext: { target: string; callers: GraphNode[] }[] = [];
    const calleesContext: { source: string; callees: GraphNode[] }[] = [];

    // Collect changed symbol node IDs from the store
    const changedSymbolIds: string[] = [];
    for (const sym of changedSymbols) {
      const nodes = graphStore.findNodesByName(sym.name);
      for (const node of nodes) {
        changedSymbolIds.push(node.id);
        const callers = graphStore.findCallers(node.id).map((c) => c.caller);
        const callees = graphStore.findCallees(node.id).map((c) => c.callee);

        if (callers.length > 0) {
          callersContext.push({ target: sym.name, callers });
        }
        if (callees.length > 0) {
          calleesContext.push({ source: sym.name, callees });
        }
      }
    }

    // 1. Run Blast Radius & Graph Compactor
    const compactor = new SmartContextCompactor(graphStore);
    const analyzer = new BlastRadiusAnalyzer(graphStore);
    const blastRadiusReport = analyzer.analyze(changedSymbolIds);
    const compactResult = compactor.generatePromptContext(changedSymbolIds, {
      maxTokens: Math.floor(maxTokens * 0.6), // 60% of budget for code graph context
      includeSignatures: true,
      includeDocstrings: true,
      includeCallChains: true,
      includeBlastRadius: true
    });

    // 2. Build structured markdown representation for LLM prompt
    const promptParts: string[] = [];

    promptParts.push('### 1. Changed Files:');
    for (const f of changedFiles) {
      promptParts.push(`- **${f.path}** (${f.status}, +${f.additions}/-${f.deletions})`);
    }

    promptParts.push('\n' + compactResult.formattedContext);

    if (activePolicies.length > 0) {
      promptParts.push('\n### 3. Organization Security & Architecture Policies:');
      for (const p of activePolicies) {
        promptParts.push(`- **${p.name}**: ${p.description || 'Enforced'}`);
        for (const r of p.rules) {
          promptParts.push(`  * Rule [${r.ruleType}] -> Action: ${r.action}`);
        }
      }
    }

    if (historicalFindings.length > 0) {
      promptParts.push('\n### 4. Historical Findings on Modified Files:');
      for (const h of historicalFindings.slice(0, 5)) {
        promptParts.push(`- [${h.severity}] ${h.title} in ${h.filePath}:${h.startLine}`);
      }
    }

    const fullPromptContext = promptParts.join('\n');
    const estimatedTokens = Math.ceil(fullPromptContext.length / 4);

    return {
      changedFiles,
      changedSymbols,
      callGraphContext: {
        callers: callersContext,
        callees: calleesContext
      },
      blastRadiusReport,
      historicalFindings,
      activePolicies,
      formattedPromptContext: fullPromptContext,
      estimatedTokens
    };
  }
}
