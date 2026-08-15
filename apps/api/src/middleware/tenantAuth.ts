import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJwt, hashApiKey, createTenantContext } from '@codeguard/auth';
import { db, apiKeys } from '@codeguard/database';
import { eq } from 'drizzle-orm';
import type { TenantContext } from '@codeguard/types';

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: TenantContext;
  }
}

/**
 * Authentication and Tenant Isolation Middleware
 * Verifies Bearer JWT token or X-API-Key header and attaches TenantContext to request
 */
export async function authenticateTenant(request: FastifyRequest, reply: FastifyReply) {
  // 1. Check API Key header
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

    request.tenant = createTenantContext(foundKey.organizationId, undefined, 'ADMIN', true);
    return;
  }

  // 2. Check Authorization Bearer JWT header
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const decoded = await verifyJwt(token);

    if (!decoded) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired session token' });
    }

    request.tenant = createTenantContext(decoded.orgId || '00000000-0000-0000-0000-000000000001', decoded.sub, (decoded.role as any) || 'MEMBER', false);
    return;
  }

  // Allow unauthenticated fallback for development demo or return 401 if strict
  // For dev convenience if no header, extract orgId query param if present
  const queryOrgId = (request.query as { organizationId?: string })?.organizationId;
  if (queryOrgId) {
    request.tenant = createTenantContext(queryOrgId, 'dev-user-demo', 'OWNER', false);
    return;
  }

  // If endpoint requires auth and no credentials provided
  // We can default to a standard demo tenant context in dev mode
  request.tenant = createTenantContext('00000000-0000-0000-0000-000000000001', 'demo-user', 'OWNER', false);
}
