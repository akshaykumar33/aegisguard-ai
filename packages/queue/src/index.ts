import { Queue, Worker, QueueOptions, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '@codeguard/config';
import { logger } from '@codeguard/logger';
import type { ReviewJobData, WebhookJobData, IndexJobData, NotificationJobData, SecurityScanJobData } from '@codeguard/types';

export const QUEUE_NAMES = {
  WEBHOOK: 'webhook.queue',
  PR_REVIEW: 'pr.review.queue',
  REPOSITORY_INDEX: 'repository.index.queue',
  SECURITY_SCAN: 'security.scan.queue',
  AI_REVIEW: 'ai.review.queue',
  AI_VERIFY: 'ai.verify.queue',
  NOTIFICATION: 'notification.queue'
} as const;

export const redisConnection = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (config.NODE_ENV === 'test') return null; // Do not spam retries in test
    return Math.min(times * 100, 3000);
  }
});

redisConnection.on('error', (err) => {
  if (config.NODE_ENV !== 'test') {
    logger.error({ err }, 'Redis connection error');
  }
});

redisConnection.on('connect', () => {
  logger.info('Connected to Redis');
});

export async function checkRedisHealth(timeoutMs = 1000): Promise<boolean> {
  try {
    if (redisConnection.status !== 'ready' && redisConnection.status !== 'connect') {
      return false;
    }
    const ping = await Promise.race([
      redisConnection.ping(),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Redis Timeout')), timeoutMs))
    ]);
    return ping === 'PONG';
  } catch {
    return false;
  }
}

const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      count: 1000
    },
    removeOnFail: {
      count: 5000
    }
  }
};

// Typed Queues
export const webhookQueue = new Queue<WebhookJobData>(QUEUE_NAMES.WEBHOOK, defaultQueueOptions);
export const reviewQueue = new Queue<ReviewJobData>(QUEUE_NAMES.PR_REVIEW, defaultQueueOptions);
export const indexQueue = new Queue<IndexJobData>(QUEUE_NAMES.REPOSITORY_INDEX, defaultQueueOptions);
export const securityQueue = new Queue<SecurityScanJobData>(QUEUE_NAMES.SECURITY_SCAN, defaultQueueOptions);
export const notificationQueue = new Queue<NotificationJobData>(QUEUE_NAMES.NOTIFICATION, defaultQueueOptions);

/**
 * Enqueue a GitHub webhook payload with deduplication key
 */
export async function enqueueWebhookJob(data: WebhookJobData): Promise<void> {
  const jobId = `webhook:${data.provider}:${data.deliveryId}`;
  await webhookQueue.add('process_webhook', data, { jobId });
  logger.info({ jobId, eventType: data.eventType }, 'Webhook job enqueued');
}

/**
 * Enqueue PR review job with deterministic ID to prevent duplicate reviews on webhook retry
 */
export async function enqueueReviewJob(data: ReviewJobData): Promise<void> {
  const jobId = `review:${data.repositoryId}:${data.prNumber}:${data.headSha}`;
  await reviewQueue.add('run_review', data, { jobId });
  logger.info({ jobId, prNumber: data.prNumber, headSha: data.headSha }, 'PR review job enqueued');
}

/**
 * Enqueue repository indexing job
 */
export async function enqueueIndexJob(data: IndexJobData): Promise<void> {
  const jobId = `index:${data.repositoryId}:${data.commitSha}`;
  await indexQueue.add('index_repository', data, { jobId });
  logger.info({ jobId, isFullIndex: data.isFullIndex }, 'Repository index job enqueued');
}

/**
 * Enqueue notification job
 */
export async function enqueueNotificationJob(data: NotificationJobData): Promise<void> {
  const jobId = `notif:${data.reviewRunId}:${data.type}`;
  await notificationQueue.add('send_notification', data, { jobId });
  logger.info({ jobId, type: data.type }, 'Notification job enqueued');
}

export { Queue, Worker, Job };
