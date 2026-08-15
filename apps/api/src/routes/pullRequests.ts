import { FastifyInstance } from 'fastify';
import { db, pullRequests, pullRequestFiles, reviewRuns } from '@codeguard/database';
import { and, eq, desc } from 'drizzle-orm';
import { authenticateTenant, resolveOrganizationId } from '../middleware/tenantAuth.js';

export async function pullRequestRoutes(server: FastifyInstance) {
  // List PRs for repository
  server.get('/pull-requests', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const query = request.query as { repositoryId?: string; state?: string };
    const targetOrgId = resolveOrganizationId(request, reply);
    if (!targetOrgId) return;

    const scope = eq(pullRequests.organizationId, targetOrgId);

    if (query.repositoryId) {
      const list = await db
        .select()
        .from(pullRequests)
        .where(and(scope, eq(pullRequests.repositoryId, query.repositoryId)))
        .orderBy(desc(pullRequests.createdAt));
      return { data: list };
    }

    const list = await db
      .select()
      .from(pullRequests)
      .where(scope)
      .orderBy(desc(pullRequests.createdAt))
      .limit(50);
    return { data: list };
  });

  // Get PR details with files & latest review run
  server.get('/pull-requests/:id', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const targetOrgId = resolveOrganizationId(request, reply);
    if (!targetOrgId) return;

    const [pr] = await db
      .select()
      .from(pullRequests)
      .where(and(eq(pullRequests.id, id), eq(pullRequests.organizationId, targetOrgId)))
      .limit(1);
    if (!pr) {
      return reply.status(404).send({ error: 'Pull Request not found' });
    }

    const files = await db.select().from(pullRequestFiles).where(eq(pullRequestFiles.pullRequestId, id));
    const reviews = await db
      .select()
      .from(reviewRuns)
      .where(eq(reviewRuns.pullRequestId, id))
      .orderBy(desc(reviewRuns.createdAt));

    return {
      data: {
        ...pr,
        files,
        reviews
      }
    };
  });
}
