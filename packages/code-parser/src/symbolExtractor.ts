import crypto from 'node:crypto';
import type { SymbolKind } from '@codeguard/types';

export interface ExtractedSymbol {
  name: string;
  kind: SymbolKind;
  filePath: string;
  startLine: number;
  endLine: number;
  signature?: string;
  docstring?: string;
  contentHash: string;
}

export class SymbolExtractor {
  /**
   * Extract code symbols from file content based on language extension
   */
  static extractSymbols(filePath: string, content: string): ExtractedSymbol[] {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';

    if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx') {
      return this.extractTypeScriptSymbols(filePath, content);
    } else if (ext === 'py') {
      return this.extractPythonSymbols(filePath, content);
    } else if (ext === 'go') {
      return this.extractGoSymbols(filePath, content);
    } else if (ext === 'java') {
      return this.extractJavaSymbols(filePath, content);
    }

    return this.extractGenericSymbols(filePath, content);
  }

  private static extractTypeScriptSymbols(filePath: string, content: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // 1. Function / Async Function
      const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/);
      if (funcMatch) {
        const name = funcMatch[1];
        const signature = `function ${name}(${funcMatch[2]})`;
        const endLine = this.findMatchingClosingBrace(lines, i);
        symbols.push({
          name,
          kind: 'FUNCTION',
          filePath,
          startLine: lineNum,
          endLine,
          signature,
          contentHash: this.hashLines(lines, i, endLine - 1)
        });
        continue;
      }

      // 2. Class
      const classMatch = line.match(/(?:export\s+)?(?:abstract\s+)?class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+[a-zA-Z0-9_$]+)?(?:\s+implements\s+[a-zA-Z0-9_$,\s]+)?/);
      if (classMatch) {
        const name = classMatch[1];
        const endLine = this.findMatchingClosingBrace(lines, i);
        symbols.push({
          name,
          kind: 'CLASS',
          filePath,
          startLine: lineNum,
          endLine,
          signature: classMatch[0].trim(),
          contentHash: this.hashLines(lines, i, endLine - 1)
        });
        continue;
      }

      // 3. Interface / Type Alias
      const ifaceMatch = line.match(/(?:export\s+)?interface\s+([a-zA-Z0-9_$]+)/);
      if (ifaceMatch) {
        const name = ifaceMatch[1];
        const endLine = this.findMatchingClosingBrace(lines, i);
        symbols.push({
          name,
          kind: 'INTERFACE',
          filePath,
          startLine: lineNum,
          endLine,
          signature: ifaceMatch[0].trim(),
          contentHash: this.hashLines(lines, i, endLine - 1)
        });
        continue;
      }

      // 4. Arrow function export: export const myHandler = async (...) => ...
      const arrowMatch = line.match(/(?:export\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/);
      if (arrowMatch) {
        const name = arrowMatch[1];
        const endLine = this.findMatchingClosingBrace(lines, i);
        symbols.push({
          name,
          kind: 'FUNCTION',
          filePath,
          startLine: lineNum,
          endLine: Math.max(lineNum, endLine),
          signature: `const ${name} = (${arrowMatch[2]}) => ...`,
          contentHash: this.hashLines(lines, i, Math.max(i, endLine - 1))
        });
      }
    }

    return symbols;
  }

  private static extractPythonSymbols(filePath: string, content: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // def my_func(arg1, arg2):
      const funcMatch = line.match(/^\s*(?:async\s+)?def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\):/);
      if (funcMatch) {
        const name = funcMatch[1];
        const endLine = this.findPythonBlockEnd(lines, i);
        symbols.push({
          name,
          kind: line.startsWith(' ') || line.startsWith('\t') ? 'METHOD' : 'FUNCTION',
          filePath,
          startLine: lineNum,
          endLine,
          signature: `def ${name}(${funcMatch[2]})`,
          contentHash: this.hashLines(lines, i, endLine - 1)
        });
      }

      // class MyClass:
      const classMatch = line.match(/^\s*class\s+([a-zA-Z0-9_]+)(?:\([^)]*\))?:/);
      if (classMatch) {
        const name = classMatch[1];
        const endLine = this.findPythonBlockEnd(lines, i);
        symbols.push({
          name,
          kind: 'CLASS',
          filePath,
          startLine: lineNum,
          endLine,
          signature: classMatch[0].trim(),
          contentHash: this.hashLines(lines, i, endLine - 1)
        });
      }
    }

    return symbols;
  }

  private static extractGoSymbols(filePath: string, content: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // func (r *Receiver) MethodName(...)
      const methodMatch = line.match(/^func\s*\(([^)]+)\)\s*([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
      if (methodMatch) {
        const name = methodMatch[2];
        const endLine = this.findMatchingClosingBrace(lines, i);
        symbols.push({
          name,
          kind: 'METHOD',
          filePath,
          startLine: lineNum,
          endLine,
          signature: line.trim(),
          contentHash: this.hashLines(lines, i, endLine - 1)
        });
        continue;
      }

      // func FunctionName(...)
      const funcMatch = line.match(/^func\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
      if (funcMatch) {
        const name = funcMatch[1];
        const endLine = this.findMatchingClosingBrace(lines, i);
        symbols.push({
          name,
          kind: 'FUNCTION',
          filePath,
          startLine: lineNum,
          endLine,
          signature: line.trim(),
          contentHash: this.hashLines(lines, i, endLine - 1)
        });
      }
    }

    return symbols;
  }

  private static extractJavaSymbols(filePath: string, content: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      const classMatch = line.match(/(?:public|protected|private)?\s*(?:static\s+)?(?:final\s+)?class\s+([a-zA-Z0-9_]+)/);
      if (classMatch) {
        const name = classMatch[1];
        const endLine = this.findMatchingClosingBrace(lines, i);
        symbols.push({
          name,
          kind: 'CLASS',
          filePath,
          startLine: lineNum,
          endLine,
          signature: line.trim(),
          contentHash: this.hashLines(lines, i, endLine - 1)
        });
      }
    }

    return symbols;
  }

  private static extractGenericSymbols(filePath: string, content: string): ExtractedSymbol[] {
    return [
      {
        name: filePath.split('/').pop() || 'file',
        kind: 'MODULE',
        filePath,
        startLine: 1,
        endLine: content.split('\n').length,
        contentHash: crypto.createHash('sha256').update(content).digest('hex')
      }
    ];
  }

  /**
   * Find the matching closing brace '}' for brace-delimited languages
   */
  private static findMatchingClosingBrace(lines: string[], startIdx: number): number {
    let openCount = 0;
    let foundOpen = false;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      for (const char of line) {
        if (char === '{') {
          openCount++;
          foundOpen = true;
        } else if (char === '}') {
          openCount--;
          if (foundOpen && openCount <= 0) {
            return i + 1;
          }
        }
      }
    }

    return Math.min(lines.length, startIdx + 25);
  }

  /**
   * Find Python block end based on indentation level
   */
  private static findPythonBlockEnd(lines: string[], startIdx: number): number {
    const startLine = lines[startIdx];
    const baseIndent = startLine.search(/\S/);

    for (let i = startIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().length === 0 || line.trim().startsWith('#')) continue;

      const indent = line.search(/\S/);
      if (indent <= baseIndent) {
        return i;
      }
    }

    return lines.length;
  }

  private static hashLines(lines: string[], startIdx: number, endIdx: number): string {
    const snippet = lines.slice(startIdx, endIdx + 1).join('\n');
    return crypto.createHash('sha256').update(snippet).digest('hex');
  }

  /**
   * Filter symbols that intersect with changed lines from a PR diff
   */
  static findChangedSymbols(symbols: ExtractedSymbol[], changedLines: number[]): ExtractedSymbol[] {
    const changedSet = new Set(changedLines);
    return symbols.filter((sym) => {
      for (let line = sym.startLine; line <= sym.endLine; line++) {
        if (changedSet.has(line)) return true;
      }
      return false;
    });
  }
}
