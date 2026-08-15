import { describe, it, expect } from 'vitest';
import { AiVerifier } from './index.js';
import type { Finding } from '@codeguard/types';

describe('AI Finding Verifier & Confidence Calibrator', () => {
  const changedFilesMap = new Map<string, number[]>();
  changedFilesMap.set('src/auth.ts', [10, 11, 12, 13, 14, 15]);

  it('should verify high-confidence findings on changed files', () => {
    const candidate: Finding = {
      id: 'f-1',
      organizationId: 'org-1',
      repositoryId: 'repo-1',
      fingerprint: 'fp-1',
      severity: 'CRITICAL',
      category: 'SECURITY',
      source: 'AI',
      title: 'Missing Authorization Header Check',
      description: 'Request bypasses JWT validation',
      filePath: 'src/auth.ts',
      startLine: 12,
      endLine: 12,
      confidence: 0.95,
      blocking: true,
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = AiVerifier.verifyFindings([candidate], changedFilesMap);
    expect(result.verifiedFindings.length).toBe(1);
    expect(result.suppressedCount).toBe(0);
    expect(result.verifiedFindings[0].blocking).toBe(true);
  });

  it('should suppress findings on unchanged files or lines far outside diff', () => {
    const hallucinatedFinding: Finding = {
      id: 'f-2',
      organizationId: 'org-1',
      repositoryId: 'repo-1',
      fingerprint: 'fp-2',
      severity: 'HIGH',
      category: 'SECURITY',
      source: 'AI',
      title: 'Hallucinated Bug on Unchanged File',
      description: 'Bug on unchanged file',
      filePath: 'src/unrelated.ts', // Unchanged file
      startLine: 50,
      endLine: 50,
      confidence: 0.8,
      blocking: true,
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = AiVerifier.verifyFindings([hallucinatedFinding], changedFilesMap);
    expect(result.verifiedFindings.length).toBe(0);
    expect(result.suppressedCount).toBe(1);
  });

  it('should downgrade medium-confidence findings to advisory non-blocking', () => {
    const mediumConfFinding: Finding = {
      id: 'f-3',
      organizationId: 'org-1',
      repositoryId: 'repo-1',
      fingerprint: 'fp-3',
      severity: 'HIGH',
      category: 'CODE_QUALITY',
      source: 'AI',
      title: 'Potential Unhandled Null Value',
      description: 'Value might be undefined',
      filePath: 'src/auth.ts',
      startLine: 14,
      endLine: 14,
      confidence: 0.75, // Between 0.70 and 0.89
      blocking: true,
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = AiVerifier.verifyFindings([mediumConfFinding], changedFilesMap);
    expect(result.verifiedFindings.length).toBe(1);
    expect(result.verifiedFindings[0].blocking).toBe(false);
    expect(result.verifiedFindings[0].severity).toBe('MEDIUM');
    expect(result.downgradedCount).toBe(1);
  });
});
