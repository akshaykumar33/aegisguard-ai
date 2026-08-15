import type { CodeGraphStore, GraphNode } from '@codeguard/code-graph';
import type { ExtractedSymbol } from '@codeguard/code-parser';
import type { Finding, Policy } from '@codeguard/types';

export interface AssembledReviewContext {
  changedFiles: { path: string; status: string; additions: number; deletions: number }[];
  changedSymbols: ExtractedSymbol[];
  callGraphContext: {
    callers: { target: string; callers: GraphNode[] }[];
    callees: { source: string; callees: GraphNode[] }[];
  };
  historicalFindings: Finding[];
  activePolicies: Policy[];
  formattedPromptContext: string;
}

export class HybridRetriever {
  /**
   * Assemble structured review context for AI reviewer
   */
  static assembleContext(
    changedFiles: { path: string; status: string; additions: number; deletions: number }[],
    changedSymbols: ExtractedSymbol[],
    graphStore: CodeGraphStore,
    activePolicies: Policy[],
    historicalFindings: Finding[] = []
  ): AssembledReviewContext {
    const callersContext: { target: string; callers: GraphNode[] }[] = [];
    const calleesContext: { source: string; callees: GraphNode[] }[] = [];

    // Traverse call graph for changed symbols
    for (const sym of changedSymbols) {
      const nodes = graphStore.findNodesByName(sym.name);
      for (const node of nodes) {
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

    // Build structured markdown representation for LLM prompt
    const promptParts: string[] = [];

    promptParts.push('### 1. Changed Files:');
    for (const f of changedFiles) {
      promptParts.push(`- **${f.path}** (${f.status}, +${f.additions}/-${f.deletions})`);
    }

    if (changedSymbols.length > 0) {
      promptParts.push('\n### 2. Changed Symbols (Functions / Classes / Routes):');
      for (const s of changedSymbols) {
        promptParts.push(`- \`${s.kind}\` **${s.name}** in \`${s.filePath}:${s.startLine}-${s.endLine}\` (${s.signature || ''})`);
      }
    }

    if (callersContext.length > 0 || calleesContext.length > 0) {
      promptParts.push('\n### 3. Repository Call Graph Context:');
      for (const c of callersContext) {
        promptParts.push(`- **${c.target}** is CALLED BY: ${c.callers.map((k) => `\`${k.name}\` (${k.filePath})`).join(', ')}`);
      }
      for (const c of calleesContext) {
        promptParts.push(`- **${c.source}** CALLS: ${c.callees.map((k) => `\`${k.name}\` (${k.filePath})`).join(', ')}`);
      }
    }

    if (activePolicies.length > 0) {
      promptParts.push('\n### 4. Organization Security & Architecture Policies:');
      for (const p of activePolicies) {
        promptParts.push(`- **${p.name}**: ${p.description || 'Enforced'}`);
        for (const r of p.rules) {
          promptParts.push(`  * Rule [${r.ruleType}] -> Action: ${r.action}`);
        }
      }
    }

    if (historicalFindings.length > 0) {
      promptParts.push('\n### 5. Historical Findings on Modified Files:');
      for (const h of historicalFindings.slice(0, 5)) {
        promptParts.push(`- [${h.severity}] ${h.title} in ${h.filePath}:${h.startLine}`);
      }
    }

    return {
      changedFiles,
      changedSymbols,
      callGraphContext: {
        callers: callersContext,
        callees: calleesContext
      },
      historicalFindings,
      activePolicies,
      formattedPromptContext: promptParts.join('\n')
    };
  }
}
