import { FastifyInstance } from 'fastify';
import { db, pullRequests, pullRequestFiles, reviewRuns } from '@codeguard/database';
import { eq, desc } from 'drizzle-orm';
import { authenticateTenant } from '../middleware/tenantAuth.js';

export async function pullRequestRoutes(server: FastifyInstance) {
  // List PRs for repository
  server.get('/pull-requests', { preHandler: [authenticateTenant] }, async (request) => {
    const query = request.query as { repositoryId?: string; state?: string };

    let prsQuery = db.select().from(pullRequests);

    if (query.repositoryId) {
      const list = await db
        .select()
        .from(pullRequests)
        .where(eq(pullRequests.repositoryId, query.repositoryId))
        .orderBy(desc(pullRequests.createdAt));
      return { data: list };
    }

    const list = await prsQuery.orderBy(desc(pullRequests.createdAt)).limit(50);
    return { data: list };
  });

  // Get PR details with files & latest review run
  server.get('/pull-requests/:id', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [pr] = await db.select().from(pullRequests).where(eq(pullRequests.id, id)).limit(1);
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
