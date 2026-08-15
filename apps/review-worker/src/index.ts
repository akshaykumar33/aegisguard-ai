import { Worker, Job, redisConnection, QUEUE_NAMES } from '@codeguard/queue';
import { logger } from '@codeguard/logger';
import { processReviewJob } from './processor.js';
import type { ReviewJobData } from '@codeguard/types';

export function startReviewWorker(): Worker<ReviewJobData> {
  const worker = new Worker<ReviewJobData>(
    QUEUE_NAMES.PR_REVIEW,
    async (job: Job<ReviewJobData>) => {
      await processReviewJob(job);
    },
    {
      connection: redisConnection,
      concurrency: 5
    }
  );

  worker.on('completed', (job: Job<ReviewJobData>) => {
    logger.info({ jobId: job.id, prNumber: job.data.prNumber }, 'Review Job completed successfully');
  });

  worker.on('failed', (job: Job<ReviewJobData> | undefined, err: Error) => {
    logger.error({ jobId: job?.id, err }, 'Review Job execution failed');
  });

  logger.info('🛡️ CodeGuard Review Worker is active and listening on pr.review.queue');
  return worker;
}

// Allow direct run
if (process.env.RUN_WORKER === 'true' || import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
  startReviewWorker();
}
