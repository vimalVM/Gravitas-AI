import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { gravitasConfig } from './project.js';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export class ConfigError extends Error {
  constructor(problems) {
    super(`Invalid server configuration:\n  - ${problems.join('\n  - ')}`);
    this.name = 'ConfigError';
    this.problems = problems;
  }
}

/** Loads server/.env into process.env (existing variables win). */
export function loadEnvFile() {
  const envPath = path.join(serverRoot, '.env');
  if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
}

const notPlaceholder = (name) => (value) => !/your[-_]?project|your[-_]?service|<[^>]*>/i.test(value) || `${name} still contains a placeholder value`;

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_ORIGIN: z.string().trim().min(1).default('http://localhost:5173'),
  SUPABASE_URL: z
    .string({ error: 'SUPABASE_URL is required (Supabase Dashboard -> Project Settings -> API)' })
    .trim()
    .url({ error: 'SUPABASE_URL must be a URL such as https://abcdefgh.supabase.co' })
    .superRefine((value, ctx) => {
      const result = notPlaceholder('SUPABASE_URL')(value);
      if (result !== true) ctx.addIssue({ code: 'custom', message: result });
    }),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string({ error: 'SUPABASE_SERVICE_ROLE_KEY is required (Supabase Dashboard -> Project Settings -> API Keys)' })
    .trim()
    .min(20, { error: 'SUPABASE_SERVICE_ROLE_KEY looks too short - paste the full service_role / secret key' })
    .superRefine((value, ctx) => {
      const result = notPlaceholder('SUPABASE_SERVICE_ROLE_KEY')(value);
      if (result !== true) ctx.addIssue({ code: 'custom', message: result });
      if (value.startsWith('sb_publishable_')) {
        ctx.addIssue({ code: 'custom', message: 'SUPABASE_SERVICE_ROLE_KEY must be the secret/service_role key, not the publishable key' });
      }
    }),
  STORAGE_BUCKET: z.string().trim().min(3).default('chat-attachments'),
  MAX_UPLOAD_MB: z.coerce.number().positive().max(50).default(gravitasConfig.uploads.maxImageMb),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(86400).default(3600),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
});

/** Validates environment variables and returns a typed, frozen config object. */
export function parseEnv(source = process.env) {
  // Treat empty strings ("SUPABASE_URL=") as missing so defaults/required errors apply.
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, v]) => v !== ''));
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    throw new ConfigError(result.error.issues.map((issue) => issue.message));
  }
  const env = result.data;
  return Object.freeze({
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    clientOrigins: env.CLIENT_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean),
    supabaseUrl: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    storageBucket: env.STORAGE_BUCKET,
    maxUploadBytes: Math.round(env.MAX_UPLOAD_MB * 1024 * 1024),
    maxUploadMb: env.MAX_UPLOAD_MB,
    signedUrlTtlSeconds: env.SIGNED_URL_TTL_SECONDS,
    trustProxy: env.TRUST_PROXY === 'true',
  });
}
