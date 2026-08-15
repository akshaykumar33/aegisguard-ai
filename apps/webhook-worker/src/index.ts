import fastify, { FastifyInstance } from 'fastify';
import { logger } from '@codeguard/logger';
import { config } from '@codeguard/config';
import { handleGitHubWebhook } from './handler.js';

export function buildWebhookServer(): FastifyInstance {
  const app = fastify({
    loggerInstance: logger as any
  });

  // Fastify content parser to capture raw body for HMAC verification
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    try {
      const buffer = typeof body === 'string' ? Buffer.from(body) : (body as Buffer);
      (req as unknown as { rawBody: Buffer }).rawBody = buffer;
      const json = JSON.parse(buffer.toString('utf-8'));
      done(null, json);
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  app.get('/health', async () => ({ status: 'ok', worker: 'webhook-worker' }));

  app.post('/api/webhooks/github', handleGitHubWebhook);
  app.post('/webhooks/github', handleGitHubWebhook);

  return app;
}

async function start() {
  const app = buildWebhookServer();
  const port = config.PORT + 1; // Run webhook service on dedicated port e.g. 3001 if local

  try {
    const address = await app.listen({
      port,
      host: config.HOST
    });
    logger.info(`⚡ CodeGuard Webhook Worker listening at: ${address}`);
  } catch (err) {
    logger.fatal({ err }, 'Failed to start Webhook Worker Server');
    process.exit(1);
  }
}

// Allow direct run
if (process.env.RUN_WORKER === 'true' || import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
  start();
}
