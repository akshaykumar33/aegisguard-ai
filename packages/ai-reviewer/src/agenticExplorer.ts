import type { GraphNode, BlastRadiusReport } from '@codeguard/code-graph';
import { CodeGraphStore, BlastRadiusAnalyzer, SmartContextCompactor } from '@codeguard/code-graph';
import { logger } from '@codeguard/logger';

export interface CodebaseToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface CodeContextResult {
  tool: string;
  query: string;
  result: unknown;
}

/**
 * Agentic Codebase Explorer providing RAG, CodeGraph queries, and AST symbol navigation
 */
export class AgenticContextExplorer {
  private graphStore: CodeGraphStore;
  private blastRadiusAnalyzer: BlastRadiusAnalyzer;
  private contextCompactor: SmartContextCompactor;
  private repositoryMemory: Map<string, string>;

  constructor(graphStore?: CodeGraphStore) {
    this.graphStore = graphStore || new CodeGraphStore();
    this.blastRadiusAnalyzer = new BlastRadiusAnalyzer(this.graphStore);
    this.contextCompactor = new SmartContextCompactor(this.graphStore);
    this.repositoryMemory = new Map();
  }

  /**
   * Tool definitions available to LLM for autonomous repository exploration
   */
  static getAvailableTools(): CodebaseToolDefinition[] {
    return [
      {
        name: 'search_symbol_definition',
        description: 'Locates where a function, class, interface, or variable is defined in the repository.',
        parameters: {
          type: 'object',
          properties: {
            symbolName: { type: 'string', description: 'Name of the function, class, or type to find' }
          },
          required: ['symbolName']
        }
      },
      {
        name: 'find_symbol_callers',
        description: 'Finds all functions and files that invoke or depend on a specific symbol.',
        parameters: {
          type: 'object',
          properties: {
            symbolName: { type: 'string', description: 'Name of the symbol whose callers to locate' }
          },
          required: ['symbolName']
        }
      },
      {
        name: 'get_symbol_blast_radius',
        description: 'Calculates the full blast radius, transitive callers, and risk score for a symbol or file change.',
        parameters: {
          type: 'object',
          properties: {
            symbolName: { type: 'string', description: 'Name of the symbol to evaluate blast radius for' }
          },
          required: ['symbolName']
        }
      },
      {
        name: 'find_impacted_tests',
        description: 'Finds all unit and integration test files that cover or call modified symbols.',
        parameters: {
          type: 'object',
          properties: {
            symbolName: { type: 'string', description: 'Name of the symbol to find tests for' }
          },
          required: ['symbolName']
        }
      },
      {
        name: 'detect_architectural_layer_violations',
        description: 'Checks if changes bypass service layers or violate clean architecture boundaries.',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  /**
   * Execute an agentic tool request
   */
  async executeTool(name: string, args: Record<string, any>): Promise<CodeContextResult> {
    logger.info({ tool: name, args }, '🛠️ Agentic Code Explorer executing tool');

    switch (name) {
      case 'search_symbol_definition': {
        const nodes: GraphNode[] = this.graphStore.findNodesByName(args.symbolName);
        return {
          tool: name,
          query: args.symbolName,
          result: nodes.map((n: GraphNode) => ({
            name: n.name,
            kind: n.kind,
            filePath: n.filePath,
            lines: `${n.startLine}-${n.endLine}`,
            signature: n.signature,
            docstring: n.docstring
          }))
        };
      }

      case 'find_symbol_callers': {
        const nodes: GraphNode[] = this.graphStore.findNodesByName(args.symbolName);
        const callers: GraphNode[] = nodes.flatMap((n: GraphNode) =>
          this.graphStore.findCallers(n.id).map((c: { caller: GraphNode }) => c.caller)
        );
        return {
          tool: name,
          query: args.symbolName,
          result: callers.map((c: GraphNode) => ({
            name: c.name,
            filePath: c.filePath,
            lines: `${c.startLine}-${c.endLine}`
          }))
        };
      }

      case 'get_symbol_blast_radius': {
        const nodes: GraphNode[] = this.graphStore.findNodesByName(args.symbolName);
        const nodeIds = nodes.map((n) => n.id);
        const report: BlastRadiusReport = this.blastRadiusAnalyzer.analyze(nodeIds);
        return {
          tool: name,
          query: args.symbolName,
          result: {
            riskScore: report.riskScore,
            totalAffectedNodes: report.totalAffectedNodes,
            dependencyDepth: report.dependencyDepth,
            riskFactors: report.riskFactors,
            directCallers: report.directCallers.map((c) => `${c.name} (${c.filePath}:${c.startLine})`),
            transitiveCallers: report.transitiveCallers.map((c) => `${c.name} (${c.filePath}:${c.startLine})`),
            impactedTestFiles: report.impactedTestFiles
          }
        };
      }

      case 'find_impacted_tests': {
        const nodes: GraphNode[] = this.graphStore.findNodesByName(args.symbolName);
        const nodeIds = nodes.map((n) => n.id);
        const report: BlastRadiusReport = this.blastRadiusAnalyzer.analyze(nodeIds);
        return {
          tool: name,
          query: args.symbolName,
          result: {
            symbol: args.symbolName,
            impactedTestFiles: report.impactedTestFiles,
            hasCoverage: report.impactedTestFiles.length > 0
          }
        };
      }

      case 'detect_architectural_layer_violations': {
        const violations = this.graphStore.detectLayerViolations();
        return {
          tool: name,
          query: 'architecture_scan',
          result: violations.map((v: { violation: string; source: GraphNode; target: GraphNode }) => ({
            violation: v.violation,
            from: `${v.source.name} (${v.source.filePath})`,
            to: `${v.target.name} (${v.target.filePath})`
          }))
        };
      }

      default:
        return {
          tool: name,
          query: JSON.stringify(args),
          result: 'Tool not supported or no additional data.'
        };
    }
  }

  /**
   * Save architectural lessons or conventions to repository memory
   */
  saveRepositoryMemory(key: string, value: string): void {
    this.repositoryMemory.set(key, value);
  }

  /**
   * Retrieve all repository architectural memories
   */
  getRepositoryMemory(): Record<string, string> {
    return Object.fromEntries(this.repositoryMemory.entries());
  }
}
