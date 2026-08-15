import { describe, it, expect } from 'vitest';
import { generateApiKey, hashApiKey, hasMinimumRole, signJwt, verifyJwt, createTenantContext } from './index.js';

describe('Auth & Multi-Tenancy Engine', () => {
  it('should generate valid API key pairs with consistent hashing', () => {
    const keyPair = generateApiKey('cg_test');
    expect(keyPair.rawKey).toMatch(/^cg_test_[a-f0-9]{48}$/);
    expect(keyPair.keyPrefix).toBe(keyPair.rawKey.slice(0, 12));

    const recomputedHash = hashApiKey(keyPair.rawKey);
    expect(recomputedHash).toBe(keyPair.hashedKey);
  });

  it('should enforce role hierarchy properly', () => {
    expect(hasMinimumRole('OWNER', 'MEMBER')).toBe(true);
    expect(hasMinimumRole('ADMIN', 'SECURITY_LEAD')).toBe(true);
    expect(hasMinimumRole('MEMBER', 'ADMIN')).toBe(false);
    expect(hasMinimumRole('READ_ONLY', 'MEMBER')).toBe(false);
    expect(hasMinimumRole('SECURITY_LEAD', 'SECURITY_LEAD')).toBe(true);
  });

  it('should sign and verify JWT tokens securely', async () => {
    const payload = {
      sub: 'usr-12345',
      email: 'alex@acme.com',
      orgId: 'org-999',
      role: 'ADMIN' as const
    };

    const token = await signJwt(payload, '1h');
    expect(token).toBeDefined();

    const decoded = await verifyJwt(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe('usr-12345');
    expect(decoded?.orgId).toBe('org-999');
    expect(decoded?.role).toBe('ADMIN');
  });

  it('should reject invalid or tampered JWT tokens', async () => {
    const tampered = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
    const decoded = await verifyJwt(tampered);
    expect(decoded).toBeNull();
  });

  it('should construct isolated tenant context', () => {
    const ctx = createTenantContext('org-123', 'user-456', 'OWNER');
    expect(ctx.organizationId).toBe('org-123');
    expect(ctx.userId).toBe('user-456');
    expect(ctx.role).toBe('OWNER');
  });
});
