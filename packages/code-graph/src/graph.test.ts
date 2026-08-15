import { describe, it, expect, beforeEach } from 'vitest';
import { CodeGraphStore, GraphNode } from './index.js';

describe('Code Graph Engine & Intelligence Store', () => {
  let graph: CodeGraphStore;

  const controllerNode: GraphNode = {
    id: 'sym-1',
    name: 'handlePaymentWebhook',
    kind: 'FUNCTION',
    filePath: 'src/controllers/paymentController.ts',
    startLine: 10,
    endLine: 45
  };

  const serviceNode: GraphNode = {
    id: 'sym-2',
    name: 'processPaymentTransaction',
    kind: 'METHOD',
    filePath: 'src/services/paymentService.ts',
    startLine: 20,
    endLine: 80
  };

  const repoNode: GraphNode = {
    id: 'sym-3',
    name: 'saveTransactionRecord',
    kind: 'METHOD',
    filePath: 'src/db/repositories/transactionRepo.ts',
    startLine: 15,
    endLine: 50
  };

  beforeEach(() => {
    graph = new CodeGraphStore();
    graph.addNode(controllerNode);
    graph.addNode(serviceNode);
    graph.addNode(repoNode);

    // Controller -> Service -> Repo
    graph.addEdge({
      sourceId: controllerNode.id,
      targetId: serviceNode.id,
      relationType: 'CALLS'
    });

    graph.addEdge({
      sourceId: serviceNode.id,
      targetId: repoNode.id,
      relationType: 'CALLS'
    });
  });

  it('should store and query nodes correctly', () => {
    expect(graph.getNode('sym-1')).toEqual(controllerNode);
    const found = graph.findNodesByName('processPaymentTransaction');
    expect(found.length).toBe(1);
    expect(found[0].id).toBe('sym-2');
  });

  it('should traverse callers and callees accurately', () => {
    // Callers of service
    const callers = graph.findCallers('sym-2');
    expect(callers.length).toBe(1);
    expect(callers[0].caller.id).toBe('sym-1');

    // Callees of service
    const callees = graph.findCallees('sym-2');
    expect(callees.length).toBe(1);
    expect(callees[0].callee.id).toBe('sym-3');
  });

  it('should extract multi-hop neighborhood graph for changed symbols', () => {
    const neighborhood = graph.extractNeighborhood(['sym-1'], 2);
    expect(neighborhood.nodes.length).toBe(3);
    expect(neighborhood.edges.length).toBe(2);
  });

  it('should detect direct architectural layer violations', () => {
    const badController: GraphNode = {
      id: 'sym-bad-ctrl',
      name: 'directDbAccessEndpoint',
      kind: 'FUNCTION',
      filePath: 'src/controllers/userController.ts',
      startLine: 5,
      endLine: 25
    };
    graph.addNode(badController);

    // Violating edge: Controller directly calls DB repo
    graph.addEdge({
      sourceId: badController.id,
      targetId: repoNode.id,
      relationType: 'CALLS'
    });

    const violations = graph.detectLayerViolations();
    expect(violations.length).toBe(1);
    expect(violations[0].violation).toContain('directly invokes DB layer');
    expect(violations[0].source.name).toBe('directDbAccessEndpoint');
  });
});
