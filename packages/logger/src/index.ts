import pino from 'pino';
import { config } from '@codeguard/config';

// Patterns to mask sensitive data
export const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers["x-hub-signature-256"]',
  'req.headers["x-api-key"]',
  'headers.authorization',
  'headers["x-hub-signature-256"]',
  'headers["x-api-key"]',
  'password',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'privateKey',
  'detectedValue',
  '*.password',
  '*.secret',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.apiKey',
  '*.privateKey'
];

/**
 * Mask raw secret strings for preview display (e.g. ak_live_12345678 -> ak_l****5678)
 */
export function maskSecretValue(val: string): string {
  if (!val) return '';
  if (val.length <= 8) return '****';
  return `${val.slice(0, 4)}****${val.slice(-4)}`;
}

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: REDACTED_PATHS,
    censor: '[REDACTED_SECRET]'
  },
  transport:
    config.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard'
          }
        }
      : undefined,
  base: {
    service: 'codeguard',
    env: config.NODE_ENV
  }
});

export type Logger = typeof logger;

export function createChildLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}
