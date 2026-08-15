import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyGitHubWebhookSignature } from './webhook.js';

describe('GitHub Webhook Signature Verification', () => {
  const secret = 'super_secure_webhook_secret_key_12345';
  const payload = JSON.stringify({ action: 'opened', repository: { name: 'payments-service' } });

  function generateSignature(body: string, key: string) {
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(body);
    return `sha256=${hmac.digest('hex')}`;
  }

  it('should validate legitimate webhook payload with correct signature', () => {
    const validSignature = generateSignature(payload, secret);
    const result = verifyGitHubWebhookSignature(payload, validSignature, secret);
    expect(result).toBe(true);
  });

  it('should reject tampered webhook payload', () => {
    const validSignature = generateSignature(payload, secret);
    const tamperedPayload = JSON.stringify({ action: 'opened', repository: { name: 'tampered-service' } });
    const result = verifyGitHubWebhookSignature(tamperedPayload, validSignature, secret);
    expect(result).toBe(false);
  });

  it('should reject signature created with wrong secret', () => {
    const invalidSignature = generateSignature(payload, 'wrong_secret_key');
    const result = verifyGitHubWebhookSignature(payload, invalidSignature, secret);
    expect(result).toBe(false);
  });

  it('should reject missing or malformed signature header', () => {
    expect(verifyGitHubWebhookSignature(payload, undefined, secret)).toBe(false);
    expect(verifyGitHubWebhookSignature(payload, 'invalid-format-no-prefix', secret)).toBe(false);
    expect(verifyGitHubWebhookSignature(payload, 'sha256=123', secret)).toBe(false);
  });
});
