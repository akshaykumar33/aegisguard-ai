import { describe, it, expect } from 'vitest';
import { maskSecretValue, REDACTED_PATHS } from './index.js';

describe('Logger & Secret Masking Sanitizer', () => {
  it('should mask sensitive strings properly', () => {
    expect(maskSecretValue('ghp_1234567890abcdef')).toBe('ghp_****cdef');
    expect(maskSecretValue('short')).toBe('****');
    expect(maskSecretValue('')).toBe('');
  });

  it('should include sensitive headers and keys in redaction list', () => {
    expect(REDACTED_PATHS).toContain('req.headers.authorization');
    expect(REDACTED_PATHS).toContain('req.headers["x-hub-signature-256"]');
    expect(REDACTED_PATHS).toContain('password');
    expect(REDACTED_PATHS).toContain('token');
  });
});
