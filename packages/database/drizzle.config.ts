import { defineConfig } from 'drizzle-kit';
import { config } from '@codeguard/config';

export default defineConfig({
  // Points at build output, not src/. drizzle-kit loads the schema through a CJS
  // require(), which cannot resolve the NodeNext `./foo.js` specifiers used in the
  // TypeScript sources. Run `pnpm build` (or `pnpm typecheck`) before db:generate.
  schema: './dist/schema/index.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.DATABASE_URL
  }
});
