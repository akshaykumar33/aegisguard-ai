import { describe, it, expect, beforeEach } from 'vitest';
import {
  CodeGraphStore,
  GraphLinker,
  IncrementalGraphIndexer,
  BlastRadiusAnalyzer,
  SmartContextCompactor,
  type GraphNode
} from './index.js';

describe('Code Graph Engine & Intelligence Store', () => {
  let graph: CodeGraphStore;

  const controllerNode: GraphNode = {
    id: 'src/controllers/paymentController.ts#handlePaymentWebhook:10',
    name: 'handlePaymentWebhook',
    kind: 'FUNCTION',
    filePath: 'src/controllers/paymentController.ts',
    startLine: 10,
    endLine: 45,
    signature: 'async function handlePaymentWebhook(req: Request, res: Response)'
  };

  const serviceNode: GraphNode = {
    id: 'src/services/paymentService.ts#processPaymentTransaction:20',
    name: 'processPaymentTransaction',
    kind: 'METHOD',
    filePath: 'src/services/paymentService.ts',
    startLine: 20,
    endLine: 80,
    signature: 'public async processPaymentTransaction(amount: number, currency: string)'
  };

  const repoNode: GraphNode = {
    id: 'src/db/repositories/transactionRepo.ts#saveTransactionRecord:15',
    name: 'saveTransactionRecord',
    kind: 'METHOD',
    filePath: 'src/db/repositories/transactionRepo.ts',
    startLine: 15,
    endLine: 50,
    signature: 'public async saveTransactionRecord(record: TransactionRecord)'
  };

  const testNode: GraphNode = {
    id: 'src/controllers/paymentController.test.ts#testWebhookHandling:5',
    name: 'testWebhookHandling',
    kind: 'FUNCTION',
    filePath: 'src/controllers/paymentController.test.ts',
    startLine: 5,
    endLine: 35
  };

  beforeEach(() => {
    graph = new CodeGraphStore();
    graph.addNode(controllerNode);
    graph.addNode(serviceNode);
    graph.addNode(repoNode);
    graph.addNode(testNode);

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

    // Test -> Controller
    graph.addEdge({
      sourceId: testNode.id,
      targetId: controllerNode.id,
      relationType: 'CALLS'
    });
  });

  it('should store and query nodes correctly', () => {
    expect(graph.getNode(controllerNode.id)).toEqual(controllerNode);
    const found = graph.findNodesByName('processPaymentTransaction');
    expect(found.length).toBe(1);
    expect(found[0].id).toBe(serviceNode.id);
  });

  it('should traverse callers and callees accurately', () => {
    // Callers of service (Controller)
    const callers = graph.findCallers(serviceNode.id);
    expect(callers.length).toBe(1);
    expect(callers[0].caller.id).toBe(controllerNode.id);

    // Callees of service (Repo)
    const callees = graph.findCallees(serviceNode.id);
    expect(callees.length).toBe(1);
    expect(callees[0].callee.id).toBe(repoNode.id);
  });

  it('should calculate degree centrality correctly', () => {
    // Service has 1 incoming (caller) * 2 + 1 outgoing = 3
    const centrality = graph.calculateCentrality(serviceNode.id);
    expect(centrality).toBe(3);
  });

  it('should compute blast radius, transitive callers, and risk factors', () => {
    const analyzer = new BlastRadiusAnalyzer(graph);
    const report = analyzer.analyze([repoNode.id]);

    expect(report.changedSymbols.length).toBe(1);
    // Direct caller: serviceNode
    expect(report.directCallers.some((c) => c.id === serviceNode.id)).toBe(true);
    // Transitive caller: controllerNode
    expect(report.transitiveCallers.some((c) => c.id === controllerNode.id)).toBe(true);
    // Test suite detected: paymentController.test.ts
    expect(report.impactedTestFiles.length).toBeGreaterThan(0);
    expect(report.riskScore).toBeGreaterThan(0);
  });

  it('should format token-budgeted compact prompt context without hallucinations', () => {
    const compactor = new SmartContextCompactor(graph);
    const result = compactor.generatePromptContext([serviceNode.id], { maxTokens: 1000 });

    expect(result.formattedContext).toContain('CodeGraph Blast Radius');
    expect(result.formattedContext).toContain('processPaymentTransaction');
    expect(result.formattedContext).toContain('public async processPaymentTransaction');
    expect(result.formattedContext).toContain('CALLED BY');
    expect(result.estimatedTokens).toBeLessThan(1000);
    expect(result.truncated).toBe(false);
  });

  it('should parse cross-file imports and link symbol calls with GraphLinker', () => {
    const testFiles = [
      {
        filePath: 'src/math.ts',
        content: `export function addNumbers(a: number, b: number): number { return a + b; }`
      },
      {
        filePath: 'src/calc.ts',
        content: `import { addNumbers } from './math';
export function calculateSum(x: number, y: number): number {
  return addNumbers(x, y);
}`
      }
    ];

    const store = new CodeGraphStore();
    const indexer = new IncrementalGraphIndexer(store);
    const result = indexer.indexFilesInMemory(testFiles);

    expect(result.totalFiles).toBe(2);
    expect(result.totalSymbols).toBe(2);

    const calcSymbol = store.findNodesByName('calculateSum')[0];
    const addSymbol = store.findNodesByName('addNumbers')[0];

    expect(calcSymbol).toBeDefined();
    expect(addSymbol).toBeDefined();

    // Verify GraphLinker created the cross-file CALLS edge
    const callers = store.findCallers(addSymbol.id);
    expect(callers.length).toBe(1);
    expect(callers[0].caller.name).toBe('calculateSum');
  });
});
