import type { SymbolKind, RelationType } from '@codeguard/types';

export interface GraphNode {
  id: string;
  name: string;
  kind: SymbolKind;
  filePath: string;
  startLine: number;
  endLine: number;
  signature?: string | null;
  docstring?: string | null;
  contentHash?: string;
  isExported?: boolean;
  parentSymbolId?: string | null;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  relationType: RelationType;
  metadata?: Record<string, unknown> | null;
}

export interface FileIndexMetadata {
  filePath: string;
  contentHash: string;
  lastIndexedAt: number;
  symbolIds: string[];
  importPaths: string[];
}

export interface SerializedGraphCache {
  version: string;
  repositoryRoot?: string;
  createdAt: number;
  updatedAt: number;
  files: Record<string, FileIndexMetadata>;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface BlastRadiusReport {
  changedSymbols: GraphNode[];
  directCallers: GraphNode[];
  transitiveCallers: GraphNode[];
  impactedTestFiles: string[];
  totalAffectedNodes: number;
  riskScore: number; // 0 - 100
  riskFactors: string[];
  dependencyDepth: number;
}

export interface TokenBudgetConfig {
  maxTokens?: number; // Default: 2500 tokens
  includeSignatures?: boolean;
  includeDocstrings?: boolean;
  includeCallChains?: boolean;
  includeBlastRadius?: boolean;
  maxCallersPerSymbol?: number;
  maxTransitiveDepth?: number;
}

export interface CompactSymbolContext {
  symbolName: string;
  kind: SymbolKind;
  filePath: string;
  lines: string;
  signature?: string;
  docstring?: string;
  callers: string[];
  callees: string[];
  impactedTests: string[];
}

export interface CompactGraphContextResult {
  formattedContext: string;
  estimatedTokens: number;
  totalSymbolsIncluded: number;
  blastRadiusScore: number;
  truncated: boolean;
}
