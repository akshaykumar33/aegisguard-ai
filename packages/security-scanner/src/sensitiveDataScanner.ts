import type { Finding } from '@codeguard/types';
import { generateFindingFingerprint } from './fingerprint.js';

export interface SensitivePattern {
  id: string;
  name: string;
  category: 'SENSITIVE_DATA';
  regex: RegExp;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  validate?: (match: string) => boolean;
}

/**
 * Standard Luhn Algorithm for validating Credit Card numbers to eliminate false positives
 */
export function validateLuhn(ccNumber: string): boolean {
  const digits = ccNumber.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export const DEFAULT_SENSITIVE_PATTERNS: SensitivePattern[] = [
  {
    id: 'SENS-001',
    name: 'Exposed Credit / Debit Card Number',
    category: 'SENSITIVE_DATA',
    regex: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
    description: 'Potential raw payment card number detected (PCI-DSS compliance violation)',
    severity: 'HIGH',
    validate: validateLuhn
  },
  {
    id: 'SENS-002',
    name: 'US Social Security Number (SSN)',
    category: 'SENSITIVE_DATA',
    regex: /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
    description: 'Exposed US Social Security Number (PII compliance violation)',
    severity: 'HIGH'
  },
  {
    id: 'SENS-003',
    name: 'Internal Infrastructure IP Address',
    category: 'SENSITIVE_DATA',
    regex: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})\b/g,
    description: 'Hardcoded RFC1918 private internal network IP address',
    severity: 'MEDIUM'
  },
  {
    id: 'SENS-004',
    name: 'Internal Corporate Endpoint / Hostname',
    category: 'SENSITIVE_DATA',
    regex: /https?:\/\/[a-zA-Z0-9_-]+\.(?:internal|corp|local|lan|vpc)(?::\d+)?(?:\/[^\s"']*)?/gi,
    description: 'Internal private enterprise hostname or service discovery URL exposed',
    severity: 'MEDIUM'
  }
];

export class SensitiveDataScanner {
  private patterns: SensitivePattern[];

  constructor(customPatterns: SensitivePattern[] = []) {
    this.patterns = [...DEFAULT_SENSITIVE_PATTERNS, ...customPatterns];
  }

  scanFile(
    filePath: string,
    content: string,
    orgId: string,
    repoId: string,
    prId?: string,
    reviewRunId?: string
  ): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineNumber = lineIndex + 1;

      for (const pattern of this.patterns) {
        pattern.regex.lastIndex = 0;
        const matches = line.matchAll(pattern.regex);

        for (const match of matches) {
          const rawMatch = match[0];

          if (pattern.validate && !pattern.validate(rawMatch)) {
            continue;
          }

          const masked = rawMatch.slice(0, 4) + '****' + rawMatch.slice(-4);
          const fingerprint = generateFindingFingerprint(pattern.id, filePath, `${lineNumber}:${rawMatch}`);

          findings.push({
            id: `finding-sens-${fingerprint.slice(0, 12)}`,
            organizationId: orgId,
            repositoryId: repoId,
            pullRequestId: prId,
            reviewRunId: reviewRunId,
            fingerprint,
            severity: pattern.severity,
            category: 'SENSITIVE_DATA',
            source: 'DETERMINISTIC',
            title: `${pattern.name} Detected`,
            description: `${pattern.description} (Pattern: ${pattern.id}). Preview: ${masked}`,
            filePath,
            startLine: lineNumber,
            endLine: lineNumber,
            evidence: `Line ${lineNumber}: ${line.trim()}`,
            impact: 'Privacy violation, regulatory non-compliance (GDPR / HIPAA / PCI-DSS), or internal network topology disclosure.',
            recommendation: 'Remove sensitive PII or internal infrastructure endpoints from source control.',
            ruleId: pattern.id,
            confidence: 0.95,
            blocking: pattern.severity === 'HIGH',
            status: 'OPEN',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    return findings;
  }
}
