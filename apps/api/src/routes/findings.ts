import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db, reviewFindings, secretFindings, dependencyFindings, auditLogs } from '@codeguard/database';
import { and, eq, desc } from 'drizzle-orm';
import { authenticateTenant, resolveOrganizationId } from '../middleware/tenantAuth.js';

const dismissSchema = z.object({
  reason: z.string().min(3).max(500)
});

export async function findingRoutes(server: FastifyInstance) {
  // List findings
  server.get('/findings', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const query = request.query as {
      organizationId?: string;
      repositoryId?: string;
      pullRequestId?: string;
      severity?: string;
      category?: string;
      status?: string;
    };

    const targetOrgId = resolveOrganizationId(request, reply, query.organizationId);
    if (!targetOrgId) return;

    // Always scoped to the caller's organization. The unfiltered branch below
    // previously returned every tenant's findings.
    const scope = eq(reviewFindings.organizationId, targetOrgId);

    if (query.pullRequestId) {
      const list = await db
        .select()
        .from(reviewFindings)
        .where(and(scope, eq(reviewFindings.pullRequestId, query.pullRequestId)))
        .orderBy(desc(reviewFindings.createdAt));
      return { data: list };
    }

    if (query.repositoryId) {
      const list = await db
        .select()
        .from(reviewFindings)
        .where(and(scope, eq(reviewFindings.repositoryId, query.repositoryId)))
        .orderBy(desc(reviewFindings.createdAt));
      return { data: list };
    }

    const list = await db
      .select()
      .from(reviewFindings)
      .where(scope)
      .orderBy(desc(reviewFindings.createdAt))
      .limit(100);
    return { data: list };
  });

  // Dismiss a finding with reason & audit trail
  server.patch('/findings/:id/dismiss', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = dismissSchema.parse(request.body);

    const targetOrgId = resolveOrganizationId(request, reply);
    if (!targetOrgId) return;

    const [finding] = await db
      .select()
      .from(reviewFindings)
      .where(and(eq(reviewFindings.id, id), eq(reviewFindings.organizationId, targetOrgId)))
      .limit(1);
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
