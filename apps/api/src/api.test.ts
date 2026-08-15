import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from './server.js';
import { signJwt } from '@codeguard/auth';
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

/**
 * These cover the rejection paths only, which is deliberate: every case below is
 * refused by the middleware before any database call, so the suite still runs
 * with no Postgres. Accepting a valid credential needs a seeded database and is
 * therefore not exercised here.
 */
describe('Authentication contract', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects an unauthenticated request to a tenant-scoped route', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/repositories' });
    expect(response.statusCode).toBe(401);
  });

  it('does not grant access via the organizationId query parameter', async () => {
    // This previously returned that organization's data with OWNER rights and no
    // credential whatsoever.
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/repositories?organizationId=00000000-0000-0000-0000-000000000001'
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects a malformed bearer token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/repositories',
      headers: { authorization: 'Bearer not-a-real-token' }
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects a valid token that carries no organization', async () => {
    const token = await signJwt({ sub: 'user-1', email: 'nobody@example.com', role: 'MEMBER' });
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/repositories',
      headers: { authorization: `Bearer ${token}` }
    });
    expect(response.statusCode).toBe(403);
  });

  it('requires authentication for the CLI policy sync endpoint', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/cli/sync' });
    expect(response.statusCode).toBe(401);
  });
});

describe('Platform admin authorization', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects an unauthenticated request to the admin surface', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/admin/customers' });
    expect(response.statusCode).toBe(401);
  });

  it('rejects an authenticated non-admin user', async () => {
    // The previous guard verified the token but never checked isPlatformAdmin,
    // so any signed-in user reached the whole admin surface.
    const token = await signJwt({
      sub: 'user-1',
      email: 'member@example.com',
      orgId: '00000000-0000-0000-0000-000000000001',
      role: 'MEMBER'
    });
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/customers',
      headers: { authorization: `Bearer ${token}` }
    });
    expect(response.statusCode).toBe(403);
  });
});

describe('Credential validation', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('refuses a login with no password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'someone@example.com' }
    });
    expect(response.statusCode).toBe(400);
  });

  it('refuses registration without a password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'someone@example.com', name: 'Someone' }
    });
    expect(response.statusCode).toBe(400);
  });

  it('refuses registration with a short password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'someone@example.com', name: 'Someone', password: 'short' }
    });
    expect(response.statusCode).toBe(400);
  });
});
