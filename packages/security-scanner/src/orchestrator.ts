import type { Finding } from '@codeguard/types';
import { SecretScanner } from './secretScanner.js';
import { SensitiveDataScanner } from './sensitiveDataScanner.js';
import { SastScanner } from './sastScanner.js';
import { DependencyScanner } from './dependencyScanner.js';

export interface FileToScan {
  filePath: string;
  content: string;
}

export class SecurityOrchestrator {
  private secretScanner: SecretScanner;
  private sensitiveDataScanner: SensitiveDataScanner;
  private sastScanner: SastScanner;
  private dependencyScanner: DependencyScanner;

  constructor() {
    this.secretScanner = new SecretScanner();
    this.sensitiveDataScanner = new SensitiveDataScanner();
    this.sastScanner = new SastScanner();
    this.dependencyScanner = new DependencyScanner();
  }

  /**
   * Run all deterministic security scans across changed files
   */
  scanFiles(
    files: FileToScan[],
    orgId: string,
    repoId: string,
    prId?: string,
    reviewRunId?: string
  ): Finding[] {
    const allFindings: Finding[] = [];

    for (const file of files) {
      // 1. Secret Scanner (API keys, tokens, private keys, passwords)
      const secretFindings = this.secretScanner.scanFile(
        file.filePath,
        file.content,
        orgId,
        repoId,
        prId,
        reviewRunId
      );
      allFindings.push(...secretFindings);

      // 2. Sensitive Data & PII Scanner (Credit cards, SSNs, internal hostnames)
      const sensitiveFindings = this.sensitiveDataScanner.scanFile(
        file.filePath,
        file.content,
        orgId,
        repoId,
        prId,
        reviewRunId
      );
      allFindings.push(...sensitiveFindings);

      // 3. SAST Scanner (SQLi, XSS, Command Injection, Path Traversal)
      const sastFindings = this.sastScanner.scanFile(
        file.filePath,
        file.content,
        orgId,
        repoId,
        prId,
        reviewRunId
      );
      allFindings.push(...sastFindings);

      // 4. Dependency Scanner (CVEs & vulnerable packages)
      const depFindings = this.dependencyScanner.scanManifest(
        file.filePath,
        file.content,
        orgId,
        repoId,
        prId,
        reviewRunId
      );
      allFindings.push(...depFindings);
    }

    return allFindings;
  }
}

export const securityOrchestrator = new SecurityOrchestrator();
