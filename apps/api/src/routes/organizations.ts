import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db, organizations, memberships, auditLogs } from '@codeguard/database';
import { eq } from 'drizzle-orm';
import { authenticateTenant, resolveOrganizationId } from '../middleware/tenantAuth.js';

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  avatarUrl: z.string().url().optional()
});

export async function organizationRoutes(server: FastifyInstance) {
  // List organizations
  server.get('/organizations', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const targetOrgId = resolveOrganizationId(request, reply);
    if (!targetOrgId) return;

    // Platform staff may enumerate every tenant; everyone else sees only their own.
    const list = request.auth?.isPlatformAdmin
      ? await db.select().from(organizations)
      : await db.select().from(organizations).where(eq(organizations.id, targetOrgId));

    return { data: list };
  });

  // Create organization
  server.post('/organizations', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const body = createOrgSchema.parse(request.body);

    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: body.name,
        slug: body.slug,
        avatarUrl: body.avatarUrl
      })
      .returning();

    // Create audit log
    await db.insert(auditLogs).values({
      organizationId: newOrg.id,
      actorId: request.tenant?.userId || 'system',
      actorType: 'USER',
      action: 'ORG_CREATED',
      resourceType: 'ORGANIZATION',
      resourceId: newOrg.id,
      metadata: { name: newOrg.name, slug: newOrg.slug }
    });

    return reply.status(201).send({ data: newOrg });
  });

  // Get specific organization
  server.get('/organizations/:id', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const targetOrgId = resolveOrganizationId(request, reply, id);
    if (!targetOrgId) return;

    const [org] = await db.select().from(organizations).where(eq(organizations.id, targetOrgId)).limit(1);

    if (!org) {
      return reply.status(404).send({ error: 'Organization not found' });
    }

    return { data: org };
  });
}
