import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJwt, hashApiKey, createTenantContext, type JwtPayload } from '@codeguard/auth';
import { db, apiKeys } from '@codeguard/database';
import { eq } from 'drizzle-orm';
import { logger } from '@codeguard/logger';
import type { TenantContext } from '@codeguard/types';

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: TenantContext;
    auth?: JwtPayload;
  }
}

/**
 * Resolve the caller from an X-API-Key header or an Authorization Bearer JWT.
 *
 * Fails closed. There is deliberately no unauthenticated fallback: an earlier
 * version granted OWNER on a hardcoded organization when no credentials were
 * present, and granted OWNER on any organization named in `?organizationId=`,
 * which made every tenant-scoped route publicly readable and writable.
 */
export async function authenticateTenant(request: FastifyRequest, reply: FastifyReply) {
  // 1. API key (service-to-service / CI)
  const apiKeyHeader = request.headers['x-api-key'] as string | undefined;
  if (apiKeyHeader) {
    const hashedKey = hashApiKey(apiKeyHeader);
    const [foundKey] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.hashedKey, hashedKey))
      .limit(1);

    if (!foundKey) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid API Key' });
    }

    if (foundKey.expiresAt && foundKey.expiresAt.getTime() < Date.now()) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'API Key has expired' });
    }

    request.tenant = createTenantContext(foundKey.organizationId, undefined, 'ADMIN', true);
    return;
  }

  // 2. Bearer JWT (interactive session)
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const decoded = await verifyJwt(token);

    if (!decoded) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired session token' });
    }

    // A token with no organization cannot address organization-scoped resources.
    // Individual customers without an org use the /customer/* portal routes instead.
    if (!decoded.orgId) {
      return reply
        .status(403)
        .send({ error: 'Forbidden', message: 'Session has no organization context' });
    }

    request.auth = decoded;
    request.tenant = createTenantContext(decoded.orgId, decoded.sub, (decoded.role as any) || 'MEMBER', false);
    return;
  }

  return reply
    .status(401)
    .send({ error: 'Unauthorized', message: 'Authentication required: provide a Bearer token or X-API-Key' });
}

/**
 * Guard for platform-staff-only routes (the /admin/* surface).
 *
 * Requires a Bearer JWT carrying isPlatformAdmin. API keys are org-scoped
 * credentials and are never accepted here.
 */
export async function requirePlatformAdmin(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply
      .status(401)
      .send({ error: 'Unauthorized', message: 'Platform administrator authentication required' });
  }

  const decoded = await verifyJwt(authHeader.slice(7).trim());
  if (!decoded) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired session token' });
  }

  if (!decoded.isPlatformAdmin) {
    logger.warn(
      { userId: decoded.sub, url: request.url },
      'Non-admin principal attempted to access a platform admin route'
    );
    return reply.status(403).send({ error: 'Forbidden', message: 'Platform administrator privileges required' });
  }

  request.auth = decoded;
  if (decoded.orgId) {
    request.tenant = createTenantContext(decoded.orgId, decoded.sub, (decoded.role as any) || 'ADMIN', false);
  }
}

/**
 * Resolve the organization a request may act on.
 *
 * Callers may name an organization explicitly, but only one they already hold a
 * credential for; anything else is rejected rather than silently honoured.
 * Platform admins may address any organization.
 */
export function resolveOrganizationId(
  request: FastifyRequest,
  reply: FastifyReply,
  requested?: string
): string | null {
  const tenantOrgId = request.tenant?.organizationId;

  if (!tenantOrgId) {
    reply.status(401).send({ error: 'Unauthorized', message: 'Authentication required' });
    return null;
  }

  if (requested && requested !== tenantOrgId && !request.auth?.isPlatformAdmin) {
    logger.warn(
      { requested, tenantOrgId, userId: request.tenant?.userId },
      'Cross-tenant access attempt blocked'
    );
    reply.status(403).send({ error: 'Forbidden', message: 'Cannot access another organization' });
    return null;
  }

  return requested && request.auth?.isPlatformAdmin ? requested : tenantOrgId;
}
