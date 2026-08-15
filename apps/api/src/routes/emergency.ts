import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db, emergencyOverrides, auditLogs, repositories } from '@codeguard/database';
import { eq, and, gt } from 'drizzle-orm';
import { authenticateTenant } from '../middleware/tenantAuth.js';

const requestBreakGlassSchema = z.object({
  organizationId: z.string().uuid(),
  repositoryId: z.string().uuid(),
  branch: z.string().min(1),
  pullRequestId: z.string().uuid().optional(),
  requesterEmail: z.string().email(),
  reason: z.string().min(10, 'A detailed technical justification is mandatory for break-glass emergency access'),
  durationMinutes: z.number().int().min(5).max(120).default(30)
});

const revokeBreakGlassSchema = z.object({
  overrideId: z.string().uuid(),
  revokedByEmail: z.string().email()
});

export async function emergencyRoutes(server: FastifyInstance) {
  // 1. Request Break-Glass Emergency Override
  server.post('/emergency/break-glass', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const body = requestBreakGlassSchema.parse(request.body);

    const [repo] = await db
      .select()
      .from(repositories)
      .where(and(eq(repositories.id, body.repositoryId), eq(repositories.organizationId, body.organizationId)))
      .limit(1);

    if (!repo) {
      return reply.status(404).send({ error: 'Repository not found in organization' });
    }

    const activeUntil = new Date(Date.now() + body.durationMinutes * 60 * 1000);

    const [override] = await db
      .insert(emergencyOverrides)
      .values({
        organizationId: body.organizationId,
        repositoryId: body.repositoryId,
        branch: body.branch,
        pullRequestId: body.pullRequestId,
        requesterId: request.tenant?.userId || '00000000-0000-0000-0000-000000000000',
        requesterEmail: body.requesterEmail,
        reason: body.reason,
        activeUntil
      })
      .returning();

    // Immutable audit log
    await db.insert(auditLogs).values({
      organizationId: body.organizationId,
      actorId: request.tenant?.userId || 'system',
      actorType: 'ADMIN',
      action: 'EMERGENCY_BREAK_GLASS_REQUESTED',
      resourceType: 'EMERGENCY_OVERRIDE',
      resourceId: override.id,
      metadata: {
        repository: repo.fullName,
        branch: body.branch,
        reason: body.reason,
        activeUntil: activeUntil.toISOString()
      }
    });

    return reply.status(201).send({
      message: 'Emergency Break-Glass authorized. All merge gates temporarily overridden under privileged audit trail.',
      data: override
    });
  });

  // 2. List Active Break-Glass Overrides
  server.get('/emergency/active', { preHandler: [authenticateTenant] }, async (request) => {
    const orgId = request.tenant?.organizationId;
    const now = new Date();

    const active = orgId
      ? await db
          .select()
          .from(emergencyOverrides)
          .where(and(eq(emergencyOverrides.organizationId, orgId), gt(emergencyOverrides.activeUntil, now)))
      : await db.select().from(emergencyOverrides).where(gt(emergencyOverrides.activeUntil, now));

    return { data: active };
  });

  // 3. Revoke Break-Glass Override
  server.post('/emergency/revoke', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const body = revokeBreakGlassSchema.parse(request.body);

    const [updated] = await db
      .update(emergencyOverrides)
      .set({ revokedAt: new Date() })
      .where(eq(emergencyOverrides.id, body.overrideId))
      .returning();

    if (!updated) {
      return reply.status(404).send({ error: 'Override not found' });
    }

    await db.insert(auditLogs).values({
      organizationId: updated.organizationId,
      actorId: request.tenant?.userId || 'system',
      actorType: 'ADMIN',
      action: 'EMERGENCY_BREAK_GLASS_EXPIRED',
      resourceType: 'EMERGENCY_OVERRIDE',
      resourceId: updated.id,
      metadata: { revokedBy: body.revokedByEmail }
    });

    return reply.send({ message: 'Emergency override revoked successfully.', data: updated });
  });
}
