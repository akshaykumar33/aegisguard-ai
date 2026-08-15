import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyGitHubWebhookSignature } from '@codeguard/github';
import { config } from '@codeguard/config';
import { logger } from '@codeguard/logger';
import { db, repositories, pullRequests, reviewRuns, auditLogs } from '@codeguard/database';
import { eq } from 'drizzle-orm';
import { enqueueReviewJob, enqueueWebhookJob } from '@codeguard/queue';
import { canRunCloudReview } from '@codeguard/policy-engine';
import { githubProvider } from '@codeguard/github';

export async function handleGitHubWebhook(request: FastifyRequest, reply: FastifyReply) {
  const signature = request.headers['x-hub-signature-256'] as string | undefined;
  const eventType = (request.headers['x-github-event'] as string) || 'unknown';
  const deliveryId = (request.headers['x-github-delivery'] as string) || 'unknown';

  // In Fastify with rawBody or JSON parsed body
  const rawBody = (request as unknown as { rawBody?: string | Buffer }).rawBody || JSON.stringify(request.body);

  // 1. Verify HMAC-SHA256 signature
  const isValid = verifyGitHubWebhookSignature(rawBody, signature, config.GITHUB_WEBHOOK_SECRET);
  if (!isValid && config.NODE_ENV === 'production') {
    logger.warn({ deliveryId, eventType }, '❌ Webhook signature verification failed');
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid webhook signature' });
  }

  const payload = request.body as Record<string, unknown>;

  // 2. Handle ping event
  if (eventType === 'ping') {
    logger.info({ deliveryId }, 'GitHub ping event received');
    return reply.status(200).send({ message: 'PONG', hook_id: payload.hook_id });
  }

  // 3. Enqueue raw webhook event to webhook.queue
  await enqueueWebhookJob({
    eventId: deliveryId,
    provider: 'github',
    eventType,
    deliveryId,
    payload,
    receivedAt: new Date().toISOString()
  });

  // 4. Process pull_request events
  if (eventType === 'pull_request') {
    const action = payload.action as string;
    const prData = payload.pull_request as Record<string, unknown>;
    const repoData = payload.repository as Record<string, unknown>;
    const installationData = payload.installation as Record<string, unknown>;

    if (prData && repoData) {
      const providerRepoId = String(repoData.id);
      const prNumber = Number(prData.number);
      const headSha = (prData.head as Record<string, unknown>)?.sha as string;
      const baseSha = (prData.base as Record<string, unknown>)?.sha as string;
      const installationId = installationData ? String(installationData.id) : '';

      // Lookup registered repository in database
      const [repo] = await db
        .select()
        .from(repositories)
        .where(eq(repositories.providerRepoId, providerRepoId))
        .limit(1);

      if (!repo) {
        logger.info({ providerRepoId, repoName: repoData.full_name }, 'Repository not registered in CodeGuard, skipping review');
        return reply.status(202).send({ status: 'ignored', message: 'Repository not connected' });
      }

      if (action === 'opened' || action === 'synchronize' || action === 'reopened') {
        // Entitlement gate. Runs before any work is queued so an out-of-plan or
        // out-of-quota organization cannot consume paid AI capacity.
        const admission = await canRunCloudReview(repo.organizationId);
        if (!admission.allowed) {
          logger.info(
            { repo: repo.fullName, prNumber, reason: admission.reason, featureCode: admission.featureCode },
            'Cloud review not admitted for this organization'
          );

          // Tell the developer on the PR instead of failing silently.
          const effectiveInstallationId = repo.installationId || installationId;
          if (effectiveInstallationId) {
            const [owner, repoName] = repo.fullName.split('/');
            if (owner && repoName) {
              try {
                await githubProvider.createCheckRun(effectiveInstallationId, owner, repoName, {
                  name: 'CodeGuard Security & Review',
                  headSha,
                  status: 'completed',
                  conclusion: 'neutral',
                  title: 'Review skipped',
                  summary: admission.reason ?? 'Automated review is not available for this organization.'
                });
              } catch (err) {
                logger.warn({ err }, 'Could not publish skipped-review check run');
              }
            }
          }

          return reply.status(202).send({
            status: 'skipped',
            reason: admission.reason,
            featureCode: admission.featureCode
          });
        }

        // Upsert PR record in database
        const [upsertedPr] = await db
          .insert(pullRequests)
          .values({
            organizationId: repo.organizationId,
            repositoryId: repo.id,
            number: prNumber,
            title: String(prData.title || ''),
            description: String(prData.body || ''),
            state: 'OPEN',
            sourceBranch: String((prData.head as Record<string, unknown>)?.ref || ''),
            targetBranch: String((prData.base as Record<string, unknown>)?.ref || ''),
            headSha,
            baseSha,
            authorUsername: String((prData.user as Record<string, unknown>)?.login || 'unknown'),
            isDraft: Boolean(prData.draft)
          })
          .onConflictDoUpdate({
            target: [pullRequests.repositoryId, pullRequests.number],
            set: {
              headSha,
              baseSha,
              title: String(prData.title || ''),
              description: String(prData.body || ''),
              state: 'OPEN',
              updatedAt: new Date()
            }
          })
          .returning();

        // Create review run record
        const [reviewRun] = await db
          .insert(reviewRuns)
          .values({
            organizationId: repo.organizationId,
            repositoryId: repo.id,
            pullRequestId: upsertedPr.id,
            commitSha: headSha,
            state: 'QUEUED',
            startedAt: new Date()
          })
          .returning();

        // Enqueue review job in pr.review.queue
        await enqueueReviewJob({
          organizationId: repo.organizationId,
          repositoryId: repo.id,
          pullRequestId: upsertedPr.id,
          prNumber,
          headSha,
          baseSha,
          installationId: repo.installationId || installationId,
          isDraft: Boolean(prData.draft)
        });

        // Audit log
        await db.insert(auditLogs).values({
          organizationId: repo.organizationId,
          actorId: String((prData.user as Record<string, unknown>)?.login || 'github-webhook'),
          actorType: 'SYSTEM',
          action: 'REVIEW_TRIGGERED',
          resourceType: 'REVIEW_RUN',
          resourceId: reviewRun.id,
          metadata: { prNumber, headSha, action }
        });

        logger.info(
          { reviewRunId: reviewRun.id, repo: repo.fullName, prNumber, headSha },
          'PR Review initialized and enqueued'
        );
      } else if (action === 'closed') {
        const isMerged = Boolean(prData.merged);
        await db
          .update(pullRequests)
          .set({
            state: isMerged ? 'MERGED' : 'CLOSED',
            mergedAt: isMerged ? new Date() : null,
            closedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(pullRequests.repositoryId, repo.id));
      }
    }
  }

  return reply.status(202).send({ status: 'accepted', deliveryId, eventType });
}
