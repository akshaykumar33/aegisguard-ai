import { z } from 'zod';
import * as dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

// Find root .env file across monorepo packages
function findEnvFile(): string | undefined {
  let current = process.cwd();
  for (let i = 0; i < 5; i++) {
    const envPath = path.join(current, '.env');
    if (fs.existsSync(envPath)) {
      return envPath;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return undefined;
}

const envFile = findEnvFile();
if (envFile) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // PostgreSQL & pgvector (Default to 5433 to avoid local conflicts)
  DATABASE_URL: z.string().url().default('postgresql://postgres:postgres@localhost:5433/codeguard_dev'),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().default(20),
  DATABASE_SSL: z.string().transform((v) => v === 'true').default('false'),

  // Redis & BullMQ
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),

  // GitHub App
  GITHUB_APP_ID: z.string().default('123456'),
  GITHUB_APP_PRIVATE_KEY: z.string().default('mock-private-key'),
  GITHUB_WEBHOOK_SECRET: z.string().min(8).default('development_webhook_secret_key_12345'),
  GITHUB_CLIENT_ID: z.string().optional().default(''),
  GITHUB_CLIENT_SECRET: z.string().optional().default(''),

  // Authentication & Cryptography
  JWT_SECRET: z.string().min(16).default('super_secret_jwt_key_at_least_32_chars_long_1234567890'),
  API_KEY_SALT: z.string().default('development_salt_key_for_api_tokens'),

  // AI & LLM Providers (Gemini, OpenAI, Anthropic)
  GEMINI_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  AI_DEFAULT_MODEL: z.string().default('gemini-2.5-flash'),
  AI_DEEP_REASONING_MODEL: z.string().default('gemini-2.5-pro'),

  // S3 / Artifact Storage
  S3_ENDPOINT: z.string().optional().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('codeguard-artifacts'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_FORCE_PATH_STYLE: z.string().transform((v) => v === 'true').default('true'),

  // Slack
  SLACK_CLIENT_ID: z.string().optional().default(''),
  SLACK_CLIENT_SECRET: z.string().optional().default(''),
  SLACK_SIGNING_SECRET: z.string().optional().default('')
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:', result.error.format());
    throw new Error('Invalid environment configuration');
  }
  return result.data;
}

export const config = loadConfig();
