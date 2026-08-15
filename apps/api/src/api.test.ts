import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from './server.js';
import type { FastifyInstance } from 'fastify';

describe('CodeGuard Fastify API Gateway', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health should return health metadata', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('services');
  });

  it('GET /docs should serve Swagger UI OpenAPI documentation', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/docs'
    });

    // Swagger UI returns 200 or 302 redirect to /docs/
    expect([200, 302]).toContain(response.statusCode);
  });
});
