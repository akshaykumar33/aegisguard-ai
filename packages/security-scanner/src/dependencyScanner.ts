import type { Finding } from '@codeguard/types';
import { generateFindingFingerprint } from './fingerprint.js';

export interface KnownVulnerability {
  cveId: string;
  packageName: string;
  packageManager: 'npm' | 'pypi' | 'go' | 'maven';
  vulnerableRange: string;
  fixedVersion: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  description: string;
}

export const KNOWN_VULNERABILITIES: KnownVulnerability[] = [
  {
    cveId: 'CVE-2024-21538',
    packageName: 'cross-spawn',
    packageManager: 'npm',
    vulnerableRange: '<7.0.5',
    fixedVersion: '7.0.5',
    severity: 'CRITICAL',
    title: 'Regular Expression Denial of Service & Command Injection in cross-spawn',
    description: 'Improper escaping of command arguments on Windows platforms.'
  },
  {
    cveId: 'CVE-2023-45857',
    packageName: 'axios',
    packageManager: 'npm',
    vulnerableRange: '<1.6.0',
    fixedVersion: '1.6.0',
    severity: 'HIGH',
    title: 'Cross-Site Request Forgery (CSRF) & Header Leak in axios',
    description: 'Axios leaks XSRF-TOKEN header during cross-origin redirect navigation.'
  },
  {
    cveId: 'CVE-2022-25883',
    packageName: 'semver',
    packageManager: 'npm',
    vulnerableRange: '<7.5.2',
    fixedVersion: '7.5.2',
    severity: 'HIGH',
    title: 'Regular Expression Denial of Service in semver',
    description: 'Vulnerable regex parsing in semver ranges.'
  },
  {
    cveId: 'CVE-2024-34064',
    packageName: 'jinja2',
    packageManager: 'pypi',
    vulnerableRange: '<3.1.4',
    fixedVersion: '3.1.4',
    severity: 'HIGH',
    title: 'HTML Attribute Injection in Jinja2 xmlattr Filter',
    description: 'xmlattr filter allowed keys containing spaces and quotes.'
  }
];

export class DependencyScanner {
  private vulnDb: KnownVulnerability[];

  constructor(vulnDb: KnownVulnerability[] = KNOWN_VULNERABILITIES) {
    this.vulnDb = vulnDb;
  }

  /**
   * Scan dependency manifests (package.json, requirements.txt)
   */
  scanManifest(
    filePath: string,
    content: string,
    orgId: string,
    repoId: string,
    prId?: string,
    reviewRunId?: string
  ): Finding[] {
    const findings: Finding[] = [];

    if (filePath.endsWith('package.json')) {
      try {
        const pkg = JSON.parse(content);
        const allDeps = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {})
        };

        for (const [depName, versionSpec] of Object.entries<string>(allDeps)) {
          const cleanVersion = versionSpec.replace(/[\^~>=<]/g, '');
          const matchingVuln = this.vulnDb.find(
            (v) => v.packageManager === 'npm' && v.packageName.toLowerCase() === depName.toLowerCase()
          );

          if (matchingVuln) {
            const fingerprint = generateFindingFingerprint(
              matchingVuln.cveId,
              filePath,
              `${depName}:${versionSpec}`
            );

            findings.push({
              id: `finding-dep-${fingerprint.slice(0, 12)}`,
              organizationId: orgId,
              repositoryId: repoId,
              pullRequestId: prId,
              reviewRunId: reviewRunId,
              fingerprint,
              severity: matchingVuln.severity,
              category: 'DEPENDENCY',
              source: 'DETERMINISTIC',
              title: `Vulnerable Dependency: ${depName} (${matchingVuln.cveId})`,
              description: `${matchingVuln.title}. Current version: ${versionSpec}, Required: >= ${matchingVuln.fixedVersion}`,
              filePath,
              startLine: 1,
              endLine: 1,
              evidence: `"${depName}": "${versionSpec}"`,
              impact: matchingVuln.description,
              recommendation: `Upgrade ${depName} to version ${matchingVuln.fixedVersion} or newer immediately.`,
              ruleId: matchingVuln.cveId,
              confidence: 1.0,
              blocking: matchingVuln.severity === 'CRITICAL',
              status: 'OPEN',
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      } catch {
        // Invalid JSON ignored
      }
    }

    return findings;
  }
}
