import type { GraphNode, GraphEdge } from './types.js';

export class CodeGraphStore {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  private nodeNameToIds: Map<string, string[]> = new Map();
  private filePathToNodeIds: Map<string, string[]> = new Map();
  private outgoingEdges: Map<string, GraphEdge[]> = new Map();
  private incomingEdges: Map<string, GraphEdge[]> = new Map();

  constructor() {}

  /**
   * Add or update a symbol node in the graph
   */
  addNode(node: GraphNode): void {
    // If node already exists, update references
    if (this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
      return;
    }

    this.nodes.set(node.id, node);

    // Index by symbol name
    const existingByName = this.nodeNameToIds.get(node.name) || [];
    if (!existingByName.includes(node.id)) {
      existingByName.push(node.id);
      this.nodeNameToIds.set(node.name, existingByName);
    }

    // Index by file path
    const existingByFile = this.filePathToNodeIds.get(node.filePath) || [];
    if (!existingByFile.includes(node.id)) {
      existingByFile.push(node.id);
      this.filePathToNodeIds.set(node.filePath, existingByFile);
    }
  }

  /**
   * Remove a single node and all its connected edges
   */
  removeNode(id: string): void {
    const node = this.nodes.get(id);
    if (!node) return;

    this.nodes.delete(id);

    // Cleanup name index
    const byName = this.nodeNameToIds.get(node.name);
    if (byName) {
      this.nodeNameToIds.set(node.name, byName.filter((nId) => nId !== id));
    }

    // Cleanup file index
    const byFile = this.filePathToNodeIds.get(node.filePath);
    if (byFile) {
      this.filePathToNodeIds.set(node.filePath, byFile.filter((nId) => nId !== id));
    }

    // Remove connected edges
    this.edges = this.edges.filter((e) => e.sourceId !== id && e.targetId !== id);
    this.outgoingEdges.delete(id);
    this.incomingEdges.delete(id);
  }

  /**
   * Remove all nodes associated with a specific file path
   */
  removeNodesByFile(filePath: string): void {
    const nodeIds = this.filePathToNodeIds.get(filePath) || [];
    for (const id of [...nodeIds]) {
      this.removeNode(id);
    }
    this.filePathToNodeIds.delete(filePath);
  }

  /**
   * Add an edge between two symbol nodes
   */
  addEdge(edge: GraphEdge): void {
    // Prevent duplicate edges
    const existingOut = this.outgoingEdges.get(edge.sourceId) || [];
    const isDup = existingOut.some(
      (e) => e.targetId === edge.targetId && e.relationType === edge.relationType
    );
    if (isDup) return;

    this.edges.push(edge);

    // Outgoing lookup
    existingOut.push(edge);
    this.outgoingEdges.set(edge.sourceId, existingOut);

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
   * Get all registered nodes
   */
  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all registered edges
   */
  getAllEdges(): GraphEdge[] {
    return [...this.edges];
  }

  /**
   * Find nodes by symbol name
   */
  findNodesByName(name: string): GraphNode[] {
    const ids = this.nodeNameToIds.get(name) || [];
    return ids.map((id) => this.nodes.get(id)!).filter(Boolean);
  }

  /**
   * Find all nodes defined in a specific file
   */
  findNodesByFile(filePath: string): GraphNode[] {
    const ids = this.filePathToNodeIds.get(filePath) || [];
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
   * Calculate degree centrality (importance) for a symbol node
   */
  calculateCentrality(nodeId: string): number {
    const outCount = (this.outgoingEdges.get(nodeId) || []).length;
    const inCount = (this.incomingEdges.get(nodeId) || []).length;
    return inCount * 2 + outCount; // Inbound callers carry 2x weight
  }

  /**
   * Detect architectural layer violations
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
   * Clear all graph data
   */
  clear(): void {
    this.nodes.clear();
    this.edges = [];
    this.nodeNameToIds.clear();
    this.filePathToNodeIds.clear();
    this.outgoingEdges.clear();
    this.incomingEdges.clear();
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
