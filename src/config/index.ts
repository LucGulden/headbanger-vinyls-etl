/**
 * Pipeline configuration entry point.
 *
 * Reads `.env`, validates it with Zod (fail fast on missing/invalid vars),
 * and exposes a single typed `config` object the rest of the pipeline
 * imports from.
 */
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

loadEnv();

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  SPOTIFY_CLIENT_ID: z.string().min(1),
  SPOTIFY_CLIENT_SECRET: z.string().min(1),

  MUSICBRAINZ_USER_AGENT: z.string().min(1),

  DISCOGS_PERSONAL_ACCESS_TOKEN: z.string().optional().default(''),

  DATA_ROOT: z.string().default('./data'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  /* eslint-disable no-console */
  console.error('Invalid environment configuration:\n');
  console.error(JSON.stringify(parsed.error.flatten(), null, 2));
  /* eslint-enable no-console */
  process.exit(1);
}

const env = parsed.data;
const packageRoot = path.resolve(process.cwd());
const dataRoot = path.resolve(packageRoot, env.DATA_ROOT);

export const config = {
  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },
  spotify: {
    clientId: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
  },
  musicbrainz: {
    userAgent: env.MUSICBRAINZ_USER_AGENT,
  },
  discogs: {
    personalAccessToken: env.DISCOGS_PERSONAL_ACCESS_TOKEN || null,
  },
  paths: {
    packageRoot,
    dataRoot,
    raw: path.join(dataRoot, 'raw'),
    stage: path.join(dataRoot, 'stage'),
    final: path.join(dataRoot, 'final'),
    checkpoint: path.join(dataRoot, 'checkpoints'),
  },
  logLevel: env.LOG_LEVEL,
} as const;

export type Config = typeof config;