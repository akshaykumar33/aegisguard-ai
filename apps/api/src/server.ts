import fastify, { FastifyInstance, FastifyError } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { logger } from '@codeguard/logger';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { customerPortalRoutes } from './routes/customerPortal.js';
import { organizationPortalRoutes } from './routes/organizationPortal.js';
import { adminPortalRoutes } from './routes/adminPortal.js';
import { organizationRoutes } from './routes/organizations.js';
import { repositoryRoutes } from './routes/repositories.js';
import { pullRequestRoutes } from './routes/pullRequests.js';
import { reviewRoutes } from './routes/reviews.js';
import { findingRoutes } from './routes/findings.js';
import { policyRoutes } from './routes/policies.js';
import { auditLogRoutes } from './routes/auditLogs.js';
import { emergencyRoutes } from './routes/emergency.js';
import { dashboardRoutes } from './routes/dashboard.js';

export function buildServer(): FastifyInstance {
  const app = fastify({
    loggerInstance: logger as any
  });

  // Security headers & CORS
  app.register(helmet, { contentSecurityPolicy: false });
  app.register(cors, { origin: '*' });

  // Dashboard & Portals Route
  app.register(dashboardRoutes);

  // OpenAPI Documentation
  app.register(swagger, {
    openapi: {
      info: {
        title: 'CodeGuard Control Plane & Subscriber Management API',
        description: 'Enterprise AI Code Governance, Multi-Tenant Subscriber Portal & Admin Management Platform',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Local Development'
        }
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          },
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          }
        }
      }
    }
  });

  app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  // Global Error Handler
  app.setErrorHandler((error: FastifyError, request, reply) => {
    logger.error({ err: error, url: request.url }, 'API Request Error');
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      error: error.name || 'InternalServerError',
      message: error.message || 'An unexpected error occurred',
      statusCode
    });
  });

  // Register API v1 routes
  app.register(
    async (v1) => {
      v1.register(healthRoutes);
      v1.register(authRoutes);
      v1.register(customerPortalRoutes);
      v1.register(organizationPortalRoutes);
      v1.register(adminPortalRoutes);
      v1.register(organizationRoutes);
      v1.register(repositoryRoutes);
      v1.register(pullRequestRoutes);
      v1.register(reviewRoutes);
      v1.register(findingRoutes);
      v1.register(policyRoutes);
      v1.register(auditLogRoutes);
      v1.register(emergencyRoutes);
    },
    { prefix: '/api/v1' }
  );

  return app;
}
