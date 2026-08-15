import crypto from 'node:crypto';
import { logger } from '@codeguard/logger';

/**
 * Verify GitHub webhook HMAC-SHA256 signature
 * Uses timingSafeEqual to avoid timing attack vulnerabilities
 */
export function verifyGitHubWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) {
    logger.warn('Missing webhook signature header or secret');
    return false;
  }

  // GitHub sends signature in the format: sha256=<hex_digest>
  const prefix = 'sha256=';
  if (!signatureHeader.startsWith(prefix)) {
    logger.warn('Invalid signature header format (missing sha256=)');
    return false;
  }

  const expectedDigest = signatureHeader.slice(prefix.length);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const calculatedDigest = hmac.digest('hex');

  const expectedBuffer = Buffer.from(expectedDigest, 'hex');
  const calculatedBuffer = Buffer.from(calculatedDigest, 'hex');

  if (expectedBuffer.length !== calculatedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);
}
