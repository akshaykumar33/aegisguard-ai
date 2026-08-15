# Production Deployment & Infrastructure Guide

## Deployment Architecture

CodeGuard is deployed as containerized microservices orchestrated via Kubernetes or Docker Compose.

```
┌─────────────────────────────────────────────────────────────┐
│                    INGRESS & LOAD BALANCER                  │
│                     (TLS Termination, WAF)                  │
└─────────────────────────────────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
  ┌─────────────────────────┐     ┌─────────────────────────┐
  │   API Control Plane     │     │  Webhook Receiver App   │
  │   (Fastify Service)     │     │  (Express / Fastify)    │
  └─────────────────────────┘     └─────────────────────────┘
               │                               │
               ▼                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │                 Redis Cluster (BullMQ)                  │
  └─────────────────────────────────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │           Review Worker Fleet (Autoscaling)             │
  │      (Tree-sitter, SAST, Gemini AI, Verification)       │
  └─────────────────────────────────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │         PostgreSQL Database (Managed / Aurora)          │
  └─────────────────────────────────────────────────────────┘
```
