#!/usr/bin/env node
/**
 * GRAVITAS AI - development-only demo account seeder.
 *
 * Creates (if missing) one ordinary test user and one AI operator account in
 * Supabase Auth using the service-role key from server/.env.
 *
 *   npm run seed:demo                      create missing accounts
 *   npm run seed:demo -- --promote-existing   also promote an EXISTING account
 *                                              with SEED_OPERATOR_EMAIL to operator
 *
 * Safety rules:
 *   - Refuses to run when NODE_ENV=production.
 *   - Credentials come from environment variables only (never hardcoded).
 *   - Never changes the password of an existing account.
 *   - Never silently promotes an existing account: that requires the explicit
 *     --promote-existing flag.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, 'server', '.env');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

const args = new Set(process.argv.slice(2));
const promoteExisting = args.has('--promote-existing');

function fail(message) {
  console.error(`\n[seed:demo] ${message}\n`);
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  fail('Refusing to run with NODE_ENV=production. This seeder is for local development only.');
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readAccount(prefix, fallbackName) {
  const email = process.env[`${prefix}_EMAIL`]?.trim();
  const password = process.env[`${prefix}_PASSWORD`];
  const name = process.env[`${prefix}_NAME`]?.trim() || fallbackName;
  if (!email && !password) return null;
  if (!email || !EMAIL_PATTERN.test(email)) fail(`${prefix}_EMAIL is missing or not a valid e-mail address.`);
  if (!password || password.length < 8) fail(`${prefix}_PASSWORD must be at least 8 characters.`);
  if (name.length > 80) fail(`${prefix}_NAME must be 80 characters or fewer.`);
  return { email, password, name };
}

const url = process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceKey) {
  fail('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env first.');
}

const userAccount = readAccount('SEED_USER', 'Demo User');
const operatorAccount = readAccount('SEED_OPERATOR', 'Gravitas Operator');
if (!userAccount && !operatorAccount) {
  fail('Nothing to do. Set SEED_USER_EMAIL/SEED_USER_PASSWORD and/or SEED_OPERATOR_EMAIL/SEED_OPERATOR_PASSWORD in server/.env.');
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(email) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(`Could not list Auth users: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function getProfile(id) {
  const { data, error } = await supabase.from('profiles').select('id, display_name, role').eq('id', id).maybeSingle();
  if (error) fail(`Could not read profile (did you run the SQL migrations?): ${error.message}`);
  return data;
}

async function ensureAccount({ email, password, name }) {
  const existing = await findUserByEmail(email);
  if (existing) return { user: existing, created: false };

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: name },
  });
  if (error) fail(`Could not create ${email}: ${error.message}`);
  return { user: data.user, created: true };
}

async function setRole(id, role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) fail(`Could not update the profile role: ${error.message}`);
}

const summary = [];

if (userAccount) {
  const { user, created } = await ensureAccount(userAccount);
  const profile = await getProfile(user.id);
  if (!profile) fail(`No profile row exists for ${userAccount.email}. Run the SQL migrations and try again.`);
  if (profile.role !== 'user') {
    console.warn(`[seed:demo] Warning: ${userAccount.email} has role "${profile.role}" - left unchanged.`);
  }
  summary.push({ account: 'User', email: userAccount.email, status: created ? 'created' : 'already existed', role: profile.role });
}

if (operatorAccount) {
  const { user, created } = await ensureAccount(operatorAccount);
  const profile = await getProfile(user.id);
  if (!profile) fail(`No profile row exists for ${operatorAccount.email}. Run the SQL migrations and try again.`);

  let status = created ? 'created' : 'already existed';
  if (profile.role !== 'ai_operator') {
    if (created || promoteExisting) {
      await setRole(user.id, 'ai_operator');
      status += ', promoted to ai_operator';
    } else {
      fail(
        `${operatorAccount.email} already exists as an ordinary user. It was NOT promoted.\n` +
          'If you really want this existing account to become the AI operator, run:\n' +
          '  npm run seed:demo -- --promote-existing\n' +
          "or run  select * from public.assign_operator_role('<email>');  in the Supabase SQL editor.",
      );
    }
  }
  summary.push({ account: 'AI operator', email: operatorAccount.email, status, role: 'ai_operator' });
}

console.log('\n[seed:demo] Done. Passwords are the ones you set in server/.env (they are not printed).');
console.table(summary);
