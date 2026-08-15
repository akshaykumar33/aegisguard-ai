import { describe, it, expect } from 'vitest';
import { parseUnifiedDiff } from './diffParser.js';
import { SymbolExtractor } from './symbolExtractor.js';

describe('Code Parser & AST Symbol Extraction', () => {
  const sampleDiff = `
diff --git a/src/payments.ts b/src/payments.ts
index 83a0e12..d81234a 100644
--- a/src/payments.ts
+++ b/src/payments.ts
@@ -10,4 +10,6 @@ export function processPayment(amount: number) {
   if (amount <= 0) {
     throw new Error("Invalid amount");
   }
+  const fee = amount * 0.02;
+  return { amount, fee };
 }
`;

  it('should parse unified diff hunks and line additions/deletions accurately', () => {
    const parsed = parseUnifiedDiff(sampleDiff);
    expect(parsed.files.length).toBe(1);
    expect(parsed.files[0].newPath).toBe('src/payments.ts');
    expect(parsed.files[0].additions).toBe(2);
    expect(parsed.files[0].deletions).toBe(0);
    expect(parsed.files[0].changedLineNumbers).toEqual([13, 14]);
  });

  it('should extract TypeScript functions, classes, and interfaces', () => {
    const tsCode = `
      export interface PaymentRequest {
        id: string;
        amount: number;
      }

      export class PaymentProcessor {
        process() { return true; }
      }

      export async function calculateTotal(items: number[]) {
        return items.reduce((a, b) => a + b, 0);
      }
    `;

    const symbols = SymbolExtractor.extractSymbols('src/processor.ts', tsCode);
    expect(symbols.length).toBe(3);

    const kinds = symbols.map((s) => s.kind);
    expect(kinds).toContain('INTERFACE');
    expect(kinds).toContain('CLASS');
    expect(kinds).toContain('FUNCTION');
  });

  it('should extract Python functions and classes', () => {
    const pyCode = `
class OrderService:
    def create_order(self, user_id, items):
        return {"status": "created"}

def process_refund(order_id):
    pass
    `;

    const symbols = SymbolExtractor.extractSymbols('services/order.py', pyCode);
    expect(symbols.length).toBe(3);
    expect(symbols.some((s) => s.name === 'OrderService' && s.kind === 'CLASS')).toBe(true);
    expect(symbols.some((s) => s.name === 'create_order' && s.kind === 'METHOD')).toBe(true);
    expect(symbols.some((s) => s.name === 'process_refund' && s.kind === 'FUNCTION')).toBe(true);
  });
});
