import crypto from 'node:crypto';

/**
 * Generate a deterministic finding fingerprint for stable deduplication
 */
export function generateFindingFingerprint(ruleId: string, filePath: string, symbolOrCode: string): string {
  const normalized = `${ruleId}:${filePath.trim()}:${symbolOrCode.trim()}`;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Mask secret string for safe logging and UI display
 */
export function maskSecret(val: string): string {
  if (!val) return '';
  if (val.length <= 8) return '****';
  return `${val.slice(0, 4)}****${val.slice(-4)}`;
}

/**
 * Hash secret string for secure database storage
 */
export function hashSecret(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}
