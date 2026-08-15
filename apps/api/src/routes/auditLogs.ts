import { FastifyInstance } from 'fastify';
import { db, auditLogs } from '@codeguard/database';
import { eq, desc } from 'drizzle-orm';
import { authenticateTenant } from '../middleware/tenantAuth.js';

export async function auditLogRoutes(server: FastifyInstance) {
  server.get('/audit-logs', { preHandler: [authenticateTenant] }, async (request) => {
    const orgId = request.tenant?.organizationId;
    const queryOrgId = (request.query as { organizationId?: string })?.organizationId;
    const targetOrgId = queryOrgId || orgId;

    const list = targetOrgId
      ? await db
          .select()
          .from(auditLogs)
          .where(eq(auditLogs.organizationId, targetOrgId))
          .orderBy(desc(auditLogs.createdAt))
          .limit(100)
      : await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100);

    return { data: list };
  });
}
