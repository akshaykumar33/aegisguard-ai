import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db, reviewFindings, secretFindings, dependencyFindings, auditLogs } from '@codeguard/database';
import { eq, desc } from 'drizzle-orm';
import { authenticateTenant } from '../middleware/tenantAuth.js';

const dismissSchema = z.object({
  reason: z.string().min(3).max(500)
});

export async function findingRoutes(server: FastifyInstance) {
  // List findings
  server.get('/findings', { preHandler: [authenticateTenant] }, async (request) => {
    const query = request.query as {
      repositoryId?: string;
      pullRequestId?: string;
      severity?: string;
      category?: string;
      status?: string;
    };

    let baseQuery = db.select().from(reviewFindings);

    if (query.pullRequestId) {
      const list = await db
        .select()
        .from(reviewFindings)
        .where(eq(reviewFindings.pullRequestId, query.pullRequestId))
        .orderBy(desc(reviewFindings.createdAt));
      return { data: list };
    }

    if (query.repositoryId) {
      const list = await db
        .select()
        .from(reviewFindings)
        .where(eq(reviewFindings.repositoryId, query.repositoryId))
        .orderBy(desc(reviewFindings.createdAt));
      return { data: list };
    }

    const list = await baseQuery.orderBy(desc(reviewFindings.createdAt)).limit(100);
    return { data: list };
  });

  // Dismiss a finding with reason & audit trail
  server.patch('/findings/:id/dismiss', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = dismissSchema.parse(request.body);

    const [finding] = await db.select().from(reviewFindings).where(eq(reviewFindings.id, id)).limit(1);
    if (!finding) {
      return reply.status(404).send({ error: 'Finding not found' });
    }

    const [updated] = await db
      .update(reviewFindings)
      .set({
        status: 'DISMISSED',
        dismissedReason: body.reason,
        dismissedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(reviewFindings.id, id))
      .returning();

    // Log to audit trail
    await db.insert(auditLogs).values({
      organizationId: finding.organizationId,
      actorId: request.tenant?.userId || 'system',
      actorType: 'USER',
      action: 'FINDING_DISMISSED',
      resourceType: 'FINDING',
      resourceId: finding.id,
      metadata: { reason: body.reason, severity: finding.severity, title: finding.title }
    });

    return { data: updated };
  });
}
