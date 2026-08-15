import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SymbolExtractor } from '@codeguard/code-parser';
import { logger } from '@codeguard/logger';
import { CodeGraphStore } from './store.js';
import { GraphLinker } from './linker.js';
import type { FileIndexMetadata, SerializedGraphCache, GraphNode } from './types.js';

export interface IndexerOptions {
  cacheDir?: string;
  cacheFileName?: string;
  ignorePatterns?: RegExp[];
  extensions?: string[];
  rootDir?: string;
  pathAliases?: Record<string, string>;
}

export interface IndexResult {
  totalFiles: number;
  cachedFilesCount: number;
  modifiedFilesCount: number;
  totalSymbols: number;
  totalEdges: number;
  durationMs: number;
  cacheSaved: boolean;
}

export class IncrementalGraphIndexer {
  private store: CodeGraphStore;
  private fileMetadata: Map<string, FileIndexMetadata> = new Map();
  private options: Required<IndexerOptions>;

  constructor(store?: CodeGraphStore, options?: IndexerOptions) {
    this.store = store || new CodeGraphStore();
    this.options = {
      cacheDir: options?.cacheDir || '.aegisguard',
      cacheFileName: options?.cacheFileName || 'graph-cache.json',
      rootDir: options?.rootDir || process.cwd(),
      ignorePatterns: options?.ignorePatterns || [
        /node_modules/,
        /\.git/,
        /dist/,
        /build/,
        /\.turbo/,
        /\.next/,
        /coverage/,
        /\.temp/
      ],
      extensions: options?.extensions || ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java'],
      pathAliases: options?.pathAliases || {}
    };
  }

  getStore(): CodeGraphStore {
    return this.store;
  }

  /**
   * Load existing cache from disk if available
   */
  loadCacheFromDisk(cachePath?: string): boolean {
    const fullPath = cachePath || path.join(this.options.rootDir, this.options.cacheDir, this.options.cacheFileName);
    if (!fs.existsSync(fullPath)) {
      return false;
    }

    try {
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const parsed: SerializedGraphCache = JSON.parse(raw);

      this.store.clear();
      for (const node of parsed.nodes) {
        this.store.addNode(node);
      }
      for (const edge of parsed.edges) {
        this.store.addEdge(edge);
      }

      this.fileMetadata.clear();
      for (const [fPath, meta] of Object.entries(parsed.files || {})) {
        this.fileMetadata.set(fPath, meta);
      }

      logger.debug({ nodes: parsed.nodes.length, edges: parsed.edges.length }, 'Loaded CodeGraph cache from disk');
      return true;
    } catch (err) {
      logger.warn({ err }, 'Failed to load CodeGraph cache from disk, falling back to full index');
      return false;
    }
  }

  /**
   * Save current graph state and file hashes to disk cache
   */
  saveCacheToDisk(cachePath?: string): boolean {
    const targetDir = path.join(this.options.rootDir, this.options.cacheDir);
    const targetFile = cachePath || path.join(targetDir, this.options.cacheFileName);

    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const cache: SerializedGraphCache = {
        version: '1.0.0',
        repositoryRoot: this.options.rootDir,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        files: Object.fromEntries(this.fileMetadata.entries()),
        nodes: this.store.getAllNodes(),
        edges: this.store.getAllEdges()
      };

      fs.writeFileSync(targetFile, JSON.stringify(cache, null, 2), 'utf-8');
      return true;
    } catch (err) {
      logger.warn({ err }, 'Failed to save CodeGraph cache to disk');
      return false;
    }
  }

  /**
   * Incrementally index a repository or list of files
   */
  async indexRepository(fileList?: string[]): Promise<IndexResult> {
    const startTime = Date.now();
    const allFiles = fileList || this.discoverFiles(this.options.rootDir);

    let cachedCount = 0;
    let modifiedCount = 0;
    const filesToReparse: { filePath: string; content: string }[] = [];
    const allFileContents: { filePath: string; content: string }[] = [];

    // 1. Check hashes for each file
    for (const filePath of allFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const contentHash = this.computeHash(content);
        const relPath = path.relative(this.options.rootDir, filePath).replace(/\\/g, '/');

        allFileContents.push({ filePath: relPath, content });

        const cachedMeta = this.fileMetadata.get(relPath);
        if (cachedMeta && cachedMeta.contentHash === contentHash) {
          cachedCount++;
        } else {
          modifiedCount++;
          filesToReparse.push({ filePath: relPath, content });
          // Clear previous nodes from store for this modified file
          this.store.removeNodesByFile(relPath);
        }
      } catch (e) {
        // Skip unreadable files
      }
    }

    // 2. Extract symbols for modified files
    for (const file of filesToReparse) {
      const extracted = SymbolExtractor.extractSymbols(file.filePath, file.content);
      const symbolIds: string[] = [];

      for (const sym of extracted) {
        const nodeId = `${sym.filePath}#${sym.name}:${sym.startLine}`;
        const node: GraphNode = {
          id: nodeId,
          name: sym.name,
          kind: sym.kind,
          filePath: sym.filePath,
          startLine: sym.startLine,
          endLine: sym.endLine,
          signature: sym.signature,
          docstring: sym.docstring,
          contentHash: sym.contentHash
        };
        this.store.addNode(node);
        symbolIds.push(nodeId);
      }

      this.fileMetadata.set(file.filePath, {
        filePath: file.filePath,
        contentHash: this.computeHash(file.content),
        lastIndexedAt: Date.now(),
        symbolIds,
        importPaths: []
      });
    }

    // 3. Re-link symbol relationships across files if any file changed
    if (filesToReparse.length > 0) {
      GraphLinker.linkRepositorySymbols(allFileContents, this.store, {
        pathAliases: this.options.pathAliases,
        rootDir: this.options.rootDir
      });
    }

    const durationMs = Date.now() - startTime;
    const cacheSaved = this.saveCacheToDisk();

    return {
      totalFiles: allFiles.length,
      cachedFilesCount: cachedCount,
      modifiedFilesCount: modifiedCount,
      totalSymbols: this.store.getAllNodes().length,
      totalEdges: this.store.getAllEdges().length,
      durationMs,
      cacheSaved
    };
  }

  /**
   * Index files in-memory from a direct file map (useful for PR diffs and ephemeral workers)
   */
  indexFilesInMemory(files: { filePath: string; content: string }[]): IndexResult {
    const startTime = Date.now();

    for (const file of files) {
      this.store.removeNodesByFile(file.filePath);
      const extracted = SymbolExtractor.extractSymbols(file.filePath, file.content);
      const symbolIds: string[] = [];

      for (const sym of extracted) {
        const nodeId = `${sym.filePath}#${sym.name}:${sym.startLine}`;
        const node: GraphNode = {
          id: nodeId,
          name: sym.name,
          kind: sym.kind,
          filePath: sym.filePath,
          startLine: sym.startLine,
          endLine: sym.endLine,
          signature: sym.signature,
          docstring: sym.docstring,
          contentHash: sym.contentHash
        };
        this.store.addNode(node);
        symbolIds.push(nodeId);
      }

      this.fileMetadata.set(file.filePath, {
        filePath: file.filePath,
        contentHash: this.computeHash(file.content),
        lastIndexedAt: Date.now(),
        symbolIds,
        importPaths: []
      });
    }

    GraphLinker.linkRepositorySymbols(files, this.store, {
      pathAliases: this.options.pathAliases,
      rootDir: this.options.rootDir
    });

    return {
      totalFiles: files.length,
      cachedFilesCount: 0,
      modifiedFilesCount: files.length,
      totalSymbols: this.store.getAllNodes().length,
      totalEdges: this.store.getAllEdges().length,
      durationMs: Date.now() - startTime,
      cacheSaved: false
    };
  }

  private discoverFiles(dir: string, accumulated: string[] = []): string[] {
    if (!fs.existsSync(dir)) return accumulated;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (this.shouldIgnore(fullPath)) continue;

      if (entry.isDirectory()) {
        this.discoverFiles(fullPath, accumulated);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (this.options.extensions.includes(ext)) {
          accumulated.push(fullPath);
        }
      }
    }
    return accumulated;
  }

  private shouldIgnore(targetPath: string): boolean {
    return this.options.ignorePatterns.some((pattern) => pattern.test(targetPath));
  }

  private computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  }
}
