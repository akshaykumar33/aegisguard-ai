import type { CodeSymbol, CodeRelationship, RelationType, SymbolKind } from '@codeguard/types';

export interface GraphNode {
  id: string;
  name: string;
  kind: SymbolKind;
  filePath: string;
  startLine: number;
  endLine: number;
  signature?: string | null;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  relationType: RelationType;
  metadata?: Record<string, unknown> | null;
}

export class CodeGraphStore {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  private nodeNameToId: Map<string, string[]> = new Map();
  private outgoingEdges: Map<string, GraphEdge[]> = new Map();
  private incomingEdges: Map<string, GraphEdge[]> = new Map();

  constructor() {}

  /**
   * Add or update a symbol node in the graph
   */
  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    const existing = this.nodeNameToId.get(node.name) || [];
    if (!existing.includes(node.id)) {
      existing.push(node.id);
      this.nodeNameToId.set(node.name, existing);
    }
  }

  /**
   * Add an edge between two symbol nodes
   */
  addEdge(edge: GraphEdge): void {
    this.edges.push(edge);

    // Outgoing lookup
    const outList = this.outgoingEdges.get(edge.sourceId) || [];
    outList.push(edge);
    this.outgoingEdges.set(edge.sourceId, outList);

    // Incoming lookup
    const inList = this.incomingEdges.get(edge.targetId) || [];
    inList.push(edge);
    this.incomingEdges.set(edge.targetId, inList);
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Find nodes by symbol name
   */
  findNodesByName(name: string): GraphNode[] {
    const ids = this.nodeNameToId.get(name) || [];
    return ids.map((id) => this.nodes.get(id)!).filter(Boolean);
  }

  /**
   * Find all nodes that call the given symbol ID (callers / incoming CALLS edges)
   */
  findCallers(targetSymbolId: string): { caller: GraphNode; edge: GraphEdge }[] {
    const incoming = this.incomingEdges.get(targetSymbolId) || [];
    const calls = incoming.filter((e) => e.relationType === 'CALLS');
    return calls
      .map((e) => {
        const caller = this.nodes.get(e.sourceId);
        return caller ? { caller, edge: e } : null;
      })
      .filter((item): item is { caller: GraphNode; edge: GraphEdge } => item !== null);
  }

  /**
   * Find all nodes called by the given symbol ID (callees / outgoing CALLS edges)
   */
  findCallees(sourceSymbolId: string): { callee: GraphNode; edge: GraphEdge }[] {
    const outgoing = this.outgoingEdges.get(sourceSymbolId) || [];
    const calls = outgoing.filter((e) => e.relationType === 'CALLS');
    return calls
      .map((e) => {
        const callee = this.nodes.get(e.targetId);
        return callee ? { callee, edge: e } : null;
      })
      .filter((item): item is { callee: GraphNode; edge: GraphEdge } => item !== null);
  }

  /**
   * Extract immediate neighborhood context (1-2 hops) for a set of changed symbol IDs
   */
  extractNeighborhood(changedSymbolIds: string[], depth = 1): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const visitedNodeIds = new Set<string>(changedSymbolIds);
    const collectedEdges = new Set<GraphEdge>();
    let currentLevel = [...changedSymbolIds];

    for (let d = 0; d < depth; d++) {
      const nextLevel: string[] = [];
      for (const id of currentLevel) {
        // Outgoing
        const outEdges = this.outgoingEdges.get(id) || [];
        for (const edge of outEdges) {
          collectedEdges.add(edge);
          if (!visitedNodeIds.has(edge.targetId)) {
            visitedNodeIds.add(edge.targetId);
            nextLevel.push(edge.targetId);
          }
        }
        // Incoming
        const inEdges = this.incomingEdges.get(id) || [];
        for (const edge of inEdges) {
          collectedEdges.add(edge);
          if (!visitedNodeIds.has(edge.sourceId)) {
            visitedNodeIds.add(edge.sourceId);
            nextLevel.push(edge.sourceId);
          }
        }
      }
      currentLevel = nextLevel;
    }

    const nodes = Array.from(visitedNodeIds)
      .map((id) => this.nodes.get(id)!)
      .filter(Boolean);

    return { nodes, edges: Array.from(collectedEdges) };
  }

  /**
   * Detect architectural layer violations (e.g. Controller directly querying Database without Repository/Service)
   */
  detectLayerViolations(
    controllerFilePattern = /controllers?|routes?/i,
    directDbFilePattern = /db|repositories|sql|prisma|drizzle/i
  ): { violation: string; source: GraphNode; target: GraphNode }[] {
    const violations: { violation: string; source: GraphNode; target: GraphNode }[] = [];

    for (const edge of this.edges) {
      if (edge.relationType === 'CALLS' || edge.relationType === 'READS' || edge.relationType === 'WRITES') {
        const source = this.nodes.get(edge.sourceId);
        const target = this.nodes.get(edge.targetId);

        if (source && target) {
          if (controllerFilePattern.test(source.filePath) && directDbFilePattern.test(target.filePath)) {
            violations.push({
              violation: `Controller/Route '${source.name}' directly invokes DB layer '${target.name}' without service abstraction`,
              source,
              target
            });
          }
        }
      }
    }

    return violations;
  }

  /**
   * Export graph to JSON format
   */
  toJSON(): { nodes: GraphNode[]; edges: GraphEdge[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges
    };
  }

  /**
   * Load graph from raw arrays
   */
  static fromJSON(data: { nodes: GraphNode[]; edges: GraphEdge[] }): CodeGraphStore {
    const store = new CodeGraphStore();
    for (const node of data.nodes) store.addNode(node);
    for (const edge of data.edges) store.addEdge(edge);
    return store;
  }
}
