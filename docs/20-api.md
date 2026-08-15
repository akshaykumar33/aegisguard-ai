# Control Plane REST API Specification

## Fastify API Routes

The CodeGuard API provides a RESTful control plane documented via OpenAPI 3.0 (`/docs`).

### Endpoints
- `GET /api/v1/health`: Liveness and readiness health probe
- `GET /api/v1/organizations`: List organizations
- `POST /api/v1/organizations`: Create new tenant organization
- `GET /api/v1/repositories`: List connected repositories
- `POST /api/v1/repositories`: Connect new repository and trigger indexing
- `GET /api/v1/policies`: List policies and rules
- `POST /api/v1/policies`: Create or update policy
- `GET /api/v1/cli/sync`: Download cryptographically signed policy for local CLI
- `GET /api/v1/pull-requests`: List pull requests with status gates
- `GET /api/v1/findings`: Query security and code quality findings
- `POST /api/v1/emergency/break-glass`: Request emergency production merge override
- `GET /api/v1/emergency/active`: List currently active break-glass overrides
- `POST /api/v1/emergency/revoke`: Revoke an active emergency override
- `GET /dashboard`: Interactive Admin Governance & Developer Web Portal
