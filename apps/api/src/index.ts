import { buildServer } from './server.js';
import { config } from '@codeguard/config';
import { logger } from '@codeguard/logger';

async function start() {
  const app = buildServer();

  try {
    const address = await app.listen({
      port: config.PORT,
      host: config.HOST
    });
    logger.info(`🚀 CodeGuard API Gateway running at: ${address}`);
    logger.info(`📖 OpenAPI Docs accessible at: ${address}/docs`);
  } catch (err) {
    logger.fatal({ err }, 'Failed to start CodeGuard API Server');
    process.exit(1);
  }
}

start();
