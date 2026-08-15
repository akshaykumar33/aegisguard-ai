# CodeGuard — Environment Setup & Configuration Guide

This guide walks you through acquiring, generating, and configuring all required environment variables for CodeGuard, with full support for **Google Gemini**, OpenAI, and Anthropic.

---

## Quick Summary Table

| Variable Name | Required? | Default for Local Dev | Purpose | How to obtain / generate |
|---|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Runtime environment | Set to `development`, `test`, or `production` |
| `PORT` | Yes | `3000` | API Server Port | Default port number |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/codeguard_dev` | PostgreSQL connection string | Run local Docker Compose or use cloud DB |
| `REDIS_URL` | Yes | `redis://localhost:6379` | Redis connection string for BullMQ | Run local Docker Compose or use cloud Redis |
| `JWT_SECRET` | Yes | *Random 32+ chars* | Signs tenant session tokens | Generate with `openssl rand -hex 32` |
| `API_KEY_SALT` | Yes | *Random salt string* | Salts API token hashes | Generate with `openssl rand -hex 16` |
| `GEMINI_API_KEY` | Yes (for AI reviews) | `AIzaSy...` | Google Gemini AI access | From [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `OPENAI_API_KEY` | Optional | `sk-...` | OpenAI API access | From [platform.openai.com](https://platform.openai.com/api-keys) |
| `ANTHROPIC_API_KEY` | Optional | `sk-ant-...` | Anthropic Claude API access | From [console.anthropic.com](https://console.anthropic.com) |
| `GITHUB_APP_ID` | Optional for local API tests | `123456` | GitHub App ID | From GitHub App settings page |
| `GITHUB_APP_PRIVATE_KEY` | Optional for local API tests | Private key PEM string | Authenticates as GitHub App | Generated in GitHub App settings |
| `GITHUB_WEBHOOK_SECRET` | Optional for local API tests | Custom secret string | Verifies webhook HMAC signature | Defined when creating GitHub App |
| `S3_ENDPOINT` / `S3_BUCKET` | Optional for local | MinIO local (`http://localhost:9000`) | Stores repository snapshots & ASTs | Docker MinIO or AWS S3 |
| `SLACK_SIGNING_SECRET` | Optional | `""` | Slack Bot notifications | From [api.slack.com/apps](https://api.slack.com/apps) |

---

## 1. Getting Started in Local Right Now (Quick 3-Step Setup)

You can run and test CodeGuard locally in under 1 minute with your Gemini API key:

### Step 1: Start Docker Services
Make sure Docker Desktop is open and run:
```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```
This launches PostgreSQL 16 (with `pgvector`), Redis 7, and MinIO storage.

### Step 2: Add your Gemini API Key to `.env`
Open `.env` and paste your Google Gemini API Key:
```env
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
AI_DEFAULT_MODEL=gemini-2.5-flash
AI_DEEP_REASONING_MODEL=gemini-2.5-pro
```

### Step 3: Run Database Migrations & Seed Demo Data
```bash
# Push the schema tables to Postgres:
pnpm db:push

# Seed demo organization, repository, and security policies:
pnpm db:seed
```

### Step 4: Start the API Server
```bash
pnpm --filter @codeguard/api dev
```
Open **[http://localhost:3000/docs](http://localhost:3000/docs)** to test the interactive Swagger UI and query organizations, repositories, policies, reviews, and findings!

---

## 2. Obtaining a Google Gemini API Key

If you need a new or additional Gemini API key:
1. Visit **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2. Sign in with your Google account.
3. Click **Create API key** (or select an existing Google Cloud project).
4. Copy the generated key (starts with `AIzaSy...`).
5. Paste into `GEMINI_API_KEY` in `.env`.

---

## 3. Generating Authentication & Crypto Keys Locally

Run these in PowerShell or terminal:

```bash
# Generate JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate API_KEY_SALT:
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 4. Connecting a Real GitHub App (When Ready)

To allow CodeGuard to receive live GitHub PR webhooks:
1. Go to **GitHub** → **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**.
2. **Webhook URL**: Your webhook URL (or ngrok: `https://xxx.ngrok-free.app/api/webhooks/github`).
3. **Webhook secret**: Choose a secret string (e.g. `development_webhook_secret_key_12345`).
4. **Permissions**:
   - `Pull requests`: Read & Write
   - `Checks`: Read & Write
   - `Contents`: Read-only
   - `Commit statuses`: Read & Write
5. **Events**: Check `Pull request`, `Pull request review`, `Check run`.
6. Download the `.pem` Private Key and set `GITHUB_APP_PRIVATE_KEY` and `GITHUB_APP_ID`.
