import { defineConfig } from 'drizzle-kit';
import { config } from '@codeguard/config';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.DATABASE_URL
  }
});
