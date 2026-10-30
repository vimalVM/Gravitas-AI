import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
// Publishable key (sb_publishable_...) or the legacy anon key. Both are public by design;
// data is protected by Row Level Security and the backend's authorization checks.
const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim();

function validate() {
  const problems = [];
  if (!url) problems.push('VITE_SUPABASE_URL is missing.');
  else if (!/^https?:\/\/.+/.test(url)) problems.push('VITE_SUPABASE_URL must start with https://');
  if (!publishableKey) problems.push('VITE_SUPABASE_PUBLISHABLE_KEY is missing.');
  else if (publishableKey.startsWith('sb_secret_')) {
    problems.push('VITE_SUPABASE_PUBLISHABLE_KEY contains a SECRET key. Use the publishable/anon key in the browser.');
  }
  return problems;
}

export const supabaseConfigProblems = validate();

export const supabase = supabaseConfigProblems.length
  ? null
  : createClient(url, publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      realtime: { params: { eventsPerSecond: 10 } },
    });
