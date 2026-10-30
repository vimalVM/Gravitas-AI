import { ConfigError, loadEnvFile, parseEnv } from './config/env.js';
import { createSupabaseAdmin } from './config/supabase.js';
import { createApp } from './app.js';

loadEnvFile();

let env;
try {
  env = parseEnv();
} catch (error) {
  if (error instanceof ConfigError) {
    console.error('\n[gravitas-ai] The API cannot start because server/.env is incomplete:\n');
    for (const problem of error.problems) console.error(`  - ${problem}`);
    console.error('\nCopy server/.env.example to server/.env and fill in your Supabase values (see README, step 8).\n');
    process.exit(1);
  }
  throw error;
}

const app = createApp({ env, supabase: createSupabaseAdmin(env) });

const server = app.listen(env.port, () => {
  console.log(`[gravitas-ai] API listening on http://localhost:${env.port}/api (${env.nodeEnv})`);
  console.log(`[gravitas-ai] Allowed client origins: ${env.clientOrigins.join(', ')}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[gravitas-ai] Port ${env.port} is already in use. Stop the other process or change PORT in server/.env.`);
  } else {
    console.error('[gravitas-ai] Server error:', error);
  }
  process.exit(1);
});

function shutdown(signal) {
  console.log(`[gravitas-ai] ${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
