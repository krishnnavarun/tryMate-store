// Loads server/.env and validates every variable once, at startup.
// If something is missing or malformed the server refuses to start with a clear
// message, instead of failing later in some random request.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Always read server/.env, no matter which folder the process was started from
// (root `npm run dev` and `cd server && npm run dev` both work).
dotenv.config({ path: path.join(serverDir, '.env'), quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  CLIENT_URL: z.url(),
  AI_SERVICE_URL: z.url(),
  AI_SERVICE_KEY: z.string().min(1, 'AI_SERVICE_KEY is required'),
  AI_MODE: z.enum(['mock', 'real']).default('mock'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ Invalid environment variables in server/.env:');
  for (const issue of parsed.error.issues) {
    console.error(`   ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('   See server/.env.example\n');
  process.exit(1);
}

const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  mongoUri: env.MONGO_URI,
  jwtSecret: env.JWT_SECRET,
  // Strip a trailing slash so it matches the browser's Origin header exactly
  clientUrl: env.CLIENT_URL.replace(/\/$/, ''),
  ai: {
    url: env.AI_SERVICE_URL.replace(/\/$/, ''),
    key: env.AI_SERVICE_KEY,
    mode: env.AI_MODE,
  },
};

if (config.isProduction && (config.jwtSecret === 'change-me' || config.ai.key === 'change-me')) {
  console.error('❌ JWT_SECRET and AI_SERVICE_KEY must be changed from "change-me" in production.');
  process.exit(1);
}
