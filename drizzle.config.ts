import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: 'wrangler.jsonc',
    dbName: 'kimmy-app-db',
  },
});