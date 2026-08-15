import crypto from 'node:crypto';
import * as jose from 'jose';
import { config } from '@codeguard/config';
import type { Role, TenantContext } from '@codeguard/types';

// Platform Admin Roles
export type PlatformRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT_ADMIN' | 'FINANCE_ADMIN' | 'CONTENT_ADMIN';

// Role hierarchy levels for Customer & Organization Roles
export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 50,
  ADMIN: 40,
  SECURITY_LEAD: 30,
  MEMBER: 20,
  READ_ONLY: 10
};

// Reusable Permission Definitions
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  OWNER: [
    'subscription.read',
    'subscription.manage',
    'billing.read',
    'billing.manage',
    'users.read',
    'users.invite',
    'users.remove',
    'users.role_change',
    'organization.manage',
    'notifications.read',
    'support.create',
    'documents.read',
    'policies.manage',
    'repositories.manage'
  ],
  ADMIN: [
    'subscription.read',
    'billing.read',
    'users.read',
    'users.invite',
    'notifications.read',
    'support.create',
    'documents.read',
    'policies.manage',
    'repositories.manage'
  ],
  SECURITY_LEAD: [
    'policies.manage',
    'policies.break_glass',
    'findings.dismiss',
    'repositories.read',
    'notifications.read',
    'support.create',
    'documents.read'
  ],
  MEMBER: [
    'repositories.read',
    'notifications.read',
    'support.create',
    'documents.read'
  ],
  READ_ONLY: [
    'repositories.read',
    'notifications.read',
    'documents.read'
  ]
};

/**
 * Check if the user's role meets or exceeds the required role level
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

/**
 * Check if a customer role has a specific permission
 */
export function hasPermission(userRole: Role, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[userRole] ?? [];
  return perms.includes(permission);
}

/**
 * Hash raw API key for secure storage and comparison
 */
export function hashApiKey(rawKey: string): string {
  return crypto
    .createHmac('sha256', config.API_KEY_SALT)
    .update(rawKey)
    .digest('hex');
}

/**
 * Generate a new secure API Key with prefix and secret token
 */
export function generateApiKey(prefix = 'cg_live'): { rawKey: string; keyPrefix: string; hashedKey: string } {
  const randomSecret = crypto.randomBytes(24).toString('hex');
  const rawKey = `${prefix}_${randomSecret}`;
  const keyPrefix = rawKey.slice(0, 12);
  const hashedKey = hashApiKey(rawKey);
  return { rawKey, keyPrefix, hashedKey };
}

/**
 * Secure password hashing using PBKDF2 with salt
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify password against hashed password
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return resolve(false);
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) return resolve(false);
      resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
    });
  });
}

const JWT_SECRET_BYTES = new TextEncoder().encode(config.JWT_SECRET);

export interface JwtPayload {
  sub: string; // userId
  email: string;
  orgId?: string;
  customerId?: string;
  role: Role | PlatformRole;
  isPlatformAdmin?: boolean;
  isImpersonated?: boolean;
  impersonatedBy?: string;
}

/**
 * Sign a new JWT session token
 */
export async function signJwt(payload: JwtPayload, expiresIn = '7d'): Promise<string> {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET_BYTES);
}

/**
 * Verify and decode JWT token
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET_BYTES);
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      orgId: payload.orgId as string | undefined,
      customerId: payload.customerId as string | undefined,
      role: payload.role as Role,
      isPlatformAdmin: Boolean(payload.isPlatformAdmin),
      isImpersonated: Boolean(payload.isImpersonated),
      impersonatedBy: payload.impersonatedBy as string | undefined
    };
  } catch {
    return null;
  }
}

/**
 * Create a TenantContext object
 */
export function createTenantContext(
  orgId: string,
  userId?: string,
  role: Role = 'MEMBER',
  isServiceAccount = false
): TenantContext {
  return {
    organizationId: orgId,
    userId,
    role,
    isServiceAccount
  };
}
