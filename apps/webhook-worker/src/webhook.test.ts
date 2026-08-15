import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildWebhookServer } from './index.js';
import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { config } from '@codeguard/config';

describe('CodeGuard Webhook Worker Service', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildWebhookServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health should return worker health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
    expect(body.worker).toBe('webhook-worker');
  });

  it('POST /api/webhooks/github should respond to GitHub ping event', async () => {
    const pingPayload = JSON.stringify({
      zen: 'Responsive is better than fast.',
      hook_id: 123456789
    });

    const hmac = crypto.createHmac('sha256', config.GITHUB_WEBHOOK_SECRET);
    hmac.update(pingPayload);
    const signature = `sha256=${hmac.digest('hex')}`;

    const response = await app.inject({
      method: 'POST',
      url: '/api/webhooks/github',
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'ping',
        'x-github-delivery': '720c26c0-1070-11e7-90c9-d52e742a3e70',
        'x-hub-signature-256': signature
      },
      payload: pingPayload
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.message).toBe('PONG');
    expect(body.hook_id).toBe(123456789);
  });
});
