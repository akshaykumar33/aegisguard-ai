import type { Finding } from '@codeguard/types';
import { logger } from '@codeguard/logger';

export interface VerificationResult {
  verifiedFindings: Finding[];
  suppressedCount: number;
  downgradedCount: number;
}

export class AiVerifier {
  /**
   * Verify candidate AI findings to filter out false positives and calibrate confidence
   */
  static verifyFindings(
    candidateFindings: Finding[],
    changedFilesMap: Map<string, number[]> // filePath -> changed line numbers
  ): VerificationResult {
    const verifiedFindings: Finding[] = [];
    let suppressedCount = 0;
    let downgradedCount = 0;

    for (const finding of candidateFindings) {
      // Deterministic scanner findings are already ground-truth verified
      if (finding.source === 'DETERMINISTIC') {
        verifiedFindings.push(finding);
        continue;
      }

      // Check 1: Does the file exist in the changed diff?
      const validLines = changedFilesMap.get(finding.filePath);
      if (!validLines) {
        logger.warn({ finding: finding.title, file: finding.filePath }, 'AI Finding points to unchanged file, suppressing');
        suppressedCount++;
        continue;
      }

      // Check 2: Does the line range intersect with any changed lines or adjacent context?
      const isLineClose = validLines.some((l) => Math.abs(l - finding.startLine) <= 5);
      if (!isLineClose) {
        logger.warn({ finding: finding.title, line: finding.startLine }, 'AI Finding outside modified line range, suppressing');
        suppressedCount++;
        continue;
      }

      // Check 3: Calibrate confidence & blocking status
      if (finding.confidence < 0.7) {
        // Low confidence -> suppress
        suppressedCount++;
        continue;
      } else if (finding.confidence < 0.9 && (finding.severity === 'CRITICAL' || finding.severity === 'HIGH')) {
        // Medium confidence -> downgrade to non-blocking advisory
        downgradedCount++;
        verifiedFindings.push({
          ...finding,
          blocking: false,
          severity: 'MEDIUM',
          title: `[Advisory] ${finding.title}`
        });
      } else {
        // High confidence (>= 0.90) -> verified
        verifiedFindings.push(finding);
      }
    }

    return {
      verifiedFindings,
      suppressedCount,
      downgradedCount
    };
  }
}
