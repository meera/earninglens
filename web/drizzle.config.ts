import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables (.env.local takes precedence)
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env

export default {
  schema: './lib/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ['markethawkeye'],
  verbose: true,
  strict: true,
} satisfies Config;
