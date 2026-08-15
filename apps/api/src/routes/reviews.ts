import { FastifyInstance } from 'fastify';
import { db, reviewRuns, reviewStages, reviewFindings, pullRequests, repositories } from '@codeguard/database';
import { and, eq, desc } from 'drizzle-orm';
import { authenticateTenant, resolveOrganizationId } from '../middleware/tenantAuth.js';
import { enqueueReviewJob } from '@codeguard/queue';

export async function reviewRoutes(server: FastifyInstance) {
  // List review runs with optional filtering
  server.get('/reviews', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const query = request.query as { organizationId?: string; repositoryId?: string; pullRequestId?: string };
    const targetOrgId = resolveOrganizationId(request, reply, query.organizationId);
    if (!targetOrgId) return;

    // The organization predicate is always applied. Filtering by repositoryId or
    // pullRequestId alone previously returned another tenant's runs to anyone who
    // could guess an id.
    const scope = eq(reviewRuns.organizationId, targetOrgId);

    let list;
    if (query.pullRequestId) {
      list = await db.select().from(reviewRuns)
        .where(and(scope, eq(reviewRuns.pullRequestId, query.pullRequestId)))
        .orderBy(desc(reviewRuns.createdAt));
    } else if (query.repositoryId) {
      list = await db.select().from(reviewRuns)
        .where(and(scope, eq(reviewRuns.repositoryId, query.repositoryId)))
        .orderBy(desc(reviewRuns.createdAt));
    } else {
      list = await db.select().from(reviewRuns).where(scope).orderBy(desc(reviewRuns.createdAt)).limit(50);
    }

    return { data: list };
  });

  // Get review run details with stages and findings
  server.get('/reviews/:id', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const targetOrgId = resolveOrganizationId(request, reply);
    if (!targetOrgId) return;

    const [review] = await db
      .select()
      .from(reviewRuns)
      .where(and(eq(reviewRuns.id, id), eq(reviewRuns.organizationId, targetOrgId)))
      .limit(1);
    if (!review) {
      return reply.status(404).send({ error: 'Review run not found' });
    }

    const stages = await db.select().from(reviewStages).where(eq(reviewStages.reviewRunId, id));
    const findings = await db.select().from(reviewFindings).where(eq(reviewFindings.reviewRunId, id));

    return {
      data: {
        ...review,
        stages,
        findings
      }
    };
  });

  // Re-run review manually
  server.post('/reviews/:id/rerun', { preHandler: [authenticateTenant] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const targetOrgId = resolveOrganizationId(request, reply);
    if (!targetOrgId) return;

    const [review] = await db
      .select()
      .from(reviewRuns)
      .where(and(eq(reviewRuns.id, id), eq(reviewRuns.organizationId, targetOrgId)))
      .limit(1);
    if (!review) {
      return reply.status(404).send({ error: 'Review run not found' });
    }

    const [pr] = await db.select().from(pullRequests).where(eq(pullRequests.id, review.pullRequestId)).limit(1);
    const [repo] = await db.select().from(repositories).where(eq(repositories.id, review.repositoryId)).limit(1);

    if (!pr || !repo) {
      return reply.status(400).send({ error: 'Associated PR or repository not found' });
    }

    // Reset review state
    await db
      .update(reviewRuns)
      .set({
        state: 'QUEUED',
        policyOutcome: null,
        startedAt: new Date(),
        completedAt: null
      })
      .where(eq(reviewRuns.id, id));

    // Enqueue review job
    await enqueueReviewJob({
      organizationId: repo.organizationId,
      repositoryId: repo.id,
      pullRequestId: pr.id,
      prNumber: pr.number,
      headSha: pr.headSha,
      baseSha: pr.baseSha,
      installationId: repo.installationId,
      isDraft: pr.isDraft
    });

    return { message: 'Review re-run enqueued successfully', reviewId: id };
  });
}
