import { createClient } from '@supabase/supabase-js';

/**
 * Privileged Supabase client (service-role key). It BYPASSES Row Level
 * Security, so every route that uses it must perform explicit authorization
 * checks first. Never send this key, or this client's raw errors, to browsers.
 */
export function createSupabaseAdmin(env) {
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'X-Client-Info': 'gravitas-ai-server' } },
  });
}
