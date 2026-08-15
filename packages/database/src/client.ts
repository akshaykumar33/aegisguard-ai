import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';
import { config } from '@codeguard/config';
import { logger } from '@codeguard/logger';

const connectionString = config.DATABASE_URL;

// Connection options for postgres-js driver
const client = postgres(connectionString, {
  max: config.DATABASE_MAX_CONNECTIONS,
  ssl: config.DATABASE_SSL ? 'require' : false,
  onnotice: () => {}, // Suppress notices
  connect_timeout: 2
});

export const db = drizzle(client, { schema });
export type Database = typeof db;

export async function checkDatabaseConnection(timeoutMs = 1000): Promise<boolean> {
  try {
    const checkPromise = client`SELECT 1`;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB Timeout')), timeoutMs)
    );
    await Promise.race([checkPromise, timeoutPromise]);
    return true;
  } catch (error) {
    if (config.NODE_ENV !== 'test') {
      logger.error({ err: error }, '❌ Database connection check failed');
    }
    return false;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await client.end();
}
