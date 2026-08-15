import { FastifyInstance } from 'fastify';
import { db, auditLogs } from '@codeguard/database';
import { eq, desc } from 'drizzle-orm';
import { authenticateTenant, resolveOrganizationId } from '../middleware/tenantAuth.js';

export async function auditLogRoutes(server: FastifyInstance) {
  server.get('/audit-logs', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const queryOrgId = (request.query as { organizationId?: string })?.organizationId;
    const targetOrgId = resolveOrganizationId(request, reply, queryOrgId);
    if (!targetOrgId) return;

    const list = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.organizationId, targetOrgId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);

    return { data: list };
  });
}
