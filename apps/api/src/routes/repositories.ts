import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db, repositories, auditLogs } from '@codeguard/database';
import { eq } from 'drizzle-orm';
import { authenticateTenant } from '../middleware/tenantAuth.js';
import { enqueueIndexJob } from '@codeguard/queue';

const connectRepoSchema = z.object({
  organizationId: z.string().uuid(),
  provider: z.enum(['github', 'gitlab', 'bitbucket']).default('github'),
  providerRepoId: z.string(),
  name: z.string(),
  fullName: z.string(),
  private: z.boolean().default(true),
  defaultBranch: z.string().default('main'),
  cloneUrl: z.string().url(),
  installationId: z.string()
});

export async function repositoryRoutes(server: FastifyInstance) {
  // List repositories with optional organizationId filter
  server.get('/repositories', { preHandler: [authenticateTenant] }, async (request) => {
    const queryOrgId = (request.query as { organizationId?: string })?.organizationId;

    const list = queryOrgId
      ? await db.select().from(repositories).where(eq(repositories.organizationId, queryOrgId))
      : await db.select().from(repositories);

    return { data: list };
  });

  // Connect/register a new repository
  server.post('/repositories', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const body = connectRepoSchema.parse(request.body);

    const [newRepo] = await db
      .insert(repositories)
      .values(body)
      .returning();

    // Trigger initial indexing job
    await enqueueIndexJob({
      organizationId: newRepo.organizationId,
      repositoryId: newRepo.id,
      commitSha: 'HEAD',
      isFullIndex: true
    });

    // Record audit log
    await db.insert(auditLogs).values({
      organizationId: newRepo.organizationId,
      actorId: request.tenant?.userId || 'system',
      actorType: 'USER',
      action: 'REPO_CONNECTED',
      resourceType: 'REPOSITORY',
      resourceId: newRepo.id,
      metadata: { fullName: newRepo.fullName, provider: newRepo.provider }
    });

    return reply.status(201).send({ data: newRepo });
  });

  // Get repository details
  server.get('/repositories/:id', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [repo] = await db.select().from(repositories).where(eq(repositories.id, id)).limit(1);

    if (!repo) {
      return reply.status(404).send({ error: 'Repository not found' });
    }

    return { data: repo };
  });
}
