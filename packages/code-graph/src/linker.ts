import path from 'node:path';
import type { GraphNode, GraphEdge } from './types.js';
import type { CodeGraphStore } from './store.js';

export interface ImportSpec {
  importedNames: { name: string; alias?: string }[];
  rawSource: string;
  resolvedFilePath?: string;
  isDefault?: boolean;
  isNamespace?: boolean;
}

export class GraphLinker {
  /**
   * Resolve and link all symbol relationships across files into the CodeGraphStore
   */
  static linkRepositorySymbols(
    files: { filePath: string; content: string }[],
    store: CodeGraphStore,
    options?: { pathAliases?: Record<string, string>; rootDir?: string }
  ): { linkedEdgesCount: number } {
    const fileSymbolMap = new Map<string, GraphNode[]>();
    for (const file of files) {
      const symbols = store.findNodesByFile(file.filePath);
      fileSymbolMap.set(file.filePath, symbols);
    }

    let edgesAdded = 0;

    for (const file of files) {
      const imports = this.parseImports(file.filePath, file.content, files.map((f) => f.filePath), options);
      const localSymbols = fileSymbolMap.get(file.filePath) || [];

      // Link IMPORTS edges between files / module symbols
      for (const imp of imports) {
        if (!imp.resolvedFilePath) continue;
        const targetFileSymbols = fileSymbolMap.get(imp.resolvedFilePath) || [];

        for (const imported of imp.importedNames) {
          const targetNode = targetFileSymbols.find((s) => s.name === imported.name);
          if (targetNode) {
            // Find which local symbols use this imported symbol
            for (const localNode of localSymbols) {
              const symbolBodyLines = this.extractSymbolLines(file.content, localNode.startLine, localNode.endLine);
              const identToLookFor = imported.alias || imported.name;
              
              if (this.containsIdentifierCall(symbolBodyLines, identToLookFor)) {
                store.addEdge({
                  sourceId: localNode.id,
                  targetId: targetNode.id,
                  relationType: 'CALLS',
                  metadata: { crossFile: true, resolvedViaImport: imp.rawSource }
                });
                edgesAdded++;
              } else if (this.containsIdentifierRef(symbolBodyLines, identToLookFor)) {
                store.addEdge({
                  sourceId: localNode.id,
                  targetId: targetNode.id,
                  relationType: 'REFERENCES',
                  metadata: { crossFile: true, resolvedViaImport: imp.rawSource }
                });
                edgesAdded++;
              }
            }
          }
        }
      }

      // Link local (intra-file) symbol calls
      for (const node of localSymbols) {
        const bodyLines = this.extractSymbolLines(file.content, node.startLine, node.endLine);
        for (const other of localSymbols) {
          if (other.id === node.id) continue;
          if (this.containsIdentifierCall(bodyLines, other.name)) {
            store.addEdge({
              sourceId: node.id,
              targetId: other.id,
              relationType: 'CALLS',
              metadata: { crossFile: false }
            });
            edgesAdded++;
          }
        }
      }
    }

    return { linkedEdgesCount: edgesAdded };
  }

  /**
   * Parse import statements from file content for TS/JS and Python
   */
  static parseImports(
    currentFilePath: string,
    content: string,
    allFilePaths: string[],
    options?: { pathAliases?: Record<string, string>; rootDir?: string }
  ): ImportSpec[] {
    const ext = path.extname(currentFilePath).toLowerCase();
    if (ext === '.py') {
      return this.parsePythonImports(currentFilePath, content, allFilePaths);
    }
    return this.parseTsJsImports(currentFilePath, content, allFilePaths, options);
  }

  private static parseTsJsImports(
    currentFilePath: string,
    content: string,
    allFilePaths: string[],
    options?: { pathAliases?: Record<string, string>; rootDir?: string }
  ): ImportSpec[] {
    const imports: ImportSpec[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('import ') && !trimmed.startsWith('const ') && !trimmed.startsWith('export {')) {
        continue;
      }

      // 1. Named imports: import { a, b as c } from './module'
      const namedMatch = trimmed.match(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/);
      if (namedMatch) {
        const rawSource = namedMatch[2];
        const rawNames = namedMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
        const importedNames = rawNames.map((n) => {
          const parts = n.split(/\s+as\s+/);
          return { name: parts[0].trim(), alias: parts[1]?.trim() };
        });

        const resolved = this.resolveModulePath(currentFilePath, rawSource, allFilePaths, options);
        imports.push({ importedNames, rawSource, resolvedFilePath: resolved });
        continue;
      }

      // 2. Default import: import MyClass from './module'
      const defaultMatch = trimmed.match(/^import\s+([a-zA-Z0-9_$]+)\s+from\s*['"]([^'"]+)['"]/);
      if (defaultMatch) {
        const name = defaultMatch[1];
        const rawSource = defaultMatch[2];
        const resolved = this.resolveModulePath(currentFilePath, rawSource, allFilePaths, options);
        imports.push({
          importedNames: [{ name, alias: name }],
          rawSource,
          resolvedFilePath: resolved,
          isDefault: true
        });
        continue;
      }

      // 3. Namespace import: import * as Util from './module'
      const nsMatch = trimmed.match(/^import\s+\*\s+as\s+([a-zA-Z0-9_$]+)\s+from\s*['"]([^'"]+)['"]/);
      if (nsMatch) {
        const name = nsMatch[1];
        const rawSource = nsMatch[2];
        const resolved = this.resolveModulePath(currentFilePath, rawSource, allFilePaths, options);
        imports.push({
          importedNames: [{ name, alias: name }],
          rawSource,
          resolvedFilePath: resolved,
          isNamespace: true
        });
        continue;
      }

      // 4. CommonJS require: const { x } = require('./module')
      const reqMatch = trimmed.match(/(?:const|let|var)\s*\{([^}]+)\}\s*=\s*require\(['"]([^'"]+)['"]\)/);
      if (reqMatch) {
        const rawSource = reqMatch[2];
        const rawNames = reqMatch[1].split(',').map((s) => s.trim()).filter(Boolean);
        const importedNames = rawNames.map((n) => {
          const parts = n.split(':');
          return { name: parts[0].trim(), alias: parts[1]?.trim() };
        });
        const resolved = this.resolveModulePath(currentFilePath, rawSource, allFilePaths, options);
        imports.push({ importedNames, rawSource, resolvedFilePath: resolved });
      }
    }

    return imports;
  }

  private static parsePythonImports(currentFilePath: string, content: string, allFilePaths: string[]): ImportSpec[] {
    const imports: ImportSpec[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // from mod import a, b as c
      const fromMatch = trimmed.match(/^from\s+([a-zA-Z0-9_.]+)\s+import\s+(.+)$/);
      if (fromMatch) {
        const rawSource = fromMatch[1];
        const rawNames = fromMatch[2].split(',').map((s) => s.trim()).filter(Boolean);
        const importedNames = rawNames.map((n) => {
          const parts = n.split(/\s+as\s+/);
          return { name: parts[0].trim(), alias: parts[1]?.trim() };
        });
        const resolved = this.resolvePythonModule(currentFilePath, rawSource, allFilePaths);
        imports.push({ importedNames, rawSource, resolvedFilePath: resolved });
      }
    }

    return imports;
  }

  /**
   * Resolve TS/JS module path including extension fallback and path aliases (@/*)
   */
  static resolveModulePath(
    currentFilePath: string,
    rawSource: string,
    allFilePaths: string[],
    options?: { pathAliases?: Record<string, string>; rootDir?: string }
  ): string | undefined {
    // 1. External node_modules packages (e.g. 'express', 'vitest')
    if (!rawSource.startsWith('.') && !rawSource.startsWith('/') && !rawSource.startsWith('@/')) {
      return undefined;
    }

    let targetBasePath = '';
    if (rawSource.startsWith('.')) {
      const currentDir = path.dirname(currentFilePath);
      targetBasePath = path.normalize(path.join(currentDir, rawSource)).replace(/\\/g, '/');
    } else if (rawSource.startsWith('@/')) {
      const subPath = rawSource.slice(2);
      targetBasePath = (options?.rootDir ? path.join(options.rootDir, subPath) : subPath).replace(/\\/g, '/');
    }

    // Under NodeNext/ESM, TypeScript sources import their siblings with a .js
    // specifier that resolves to a .ts file on disk ('./service.js' -> service.ts).
    // Without stripping that suffix the candidates below only ever produce
    // 'service.js.ts' and nothing links in a NodeNext codebase.
    const basePaths = [targetBasePath];
    const emittedExt = targetBasePath.match(/\.(js|jsx|mjs|cjs)$/);
    if (emittedExt) {
      basePaths.push(targetBasePath.slice(0, -emittedExt[0].length));
    }

    // Try matching extensions
    const candidateExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
    for (const basePath of basePaths) {
      for (const ext of candidateExtensions) {
        const testPath = (basePath + ext).replace(/\\/g, '/');
        const found = allFilePaths.find((f) => f.replace(/\\/g, '/') === testPath || f.endsWith(testPath));
        if (found) return found;
      }
    }

    return undefined;
  }

  private static resolvePythonModule(currentFilePath: string, rawSource: string, allFilePaths: string[]): string | undefined {
    const relativePath = rawSource.replace(/\./g, '/') + '.py';
    return allFilePaths.find((f) => f.endsWith(relativePath));
  }

  private static extractSymbolLines(fullContent: string, startLine: number, endLine: number): string {
    const lines = fullContent.split('\n');
    return lines.slice(Math.max(0, startLine - 1), Math.min(lines.length, endLine)).join('\n');
  }

  private static containsIdentifierCall(content: string, ident: string): boolean {
    const regex = new RegExp(`\\b${ident}\\s*\\(`, 'm');
    return regex.test(content);
  }

  private static containsIdentifierRef(content: string, ident: string): boolean {
    const regex = new RegExp(`\\b${ident}\\b`, 'm');
    return regex.test(content);
  }
}
