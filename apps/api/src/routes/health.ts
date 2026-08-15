import { FastifyInstance } from 'fastify';
import { checkDatabaseConnection } from '@codeguard/database';
import { checkRedisHealth } from '@codeguard/queue';

export async function healthRoutes(server: FastifyInstance) {
  server.get('/health', async () => {
    const dbHealthy = await checkDatabaseConnection(500);
    const redisHealthy = await checkRedisHealth(500);

    const status = dbHealthy && redisHealthy ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        redis: redisHealthy ? 'healthy' : 'unhealthy'
      }
    };
  });
}
