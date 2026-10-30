#!/usr/bin/env node
/**
 * Scans the production client bundle (client/dist) for server secrets:
 *   - the actual SUPABASE_SERVICE_ROLE_KEY value from server/.env (if present)
 *   - new-style secret keys (sb_secret_...)
 *   - legacy JWT keys whose payload has role "service_role"
 * Exits with code 1 if anything is found. Run after `npm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'client', 'dist');
const envPath = path.join(root, 'server', '.env');

if (!fs.existsSync(distDir)) {
  console.error('[verify:bundle] client/dist not found. Run `npm run build` first.');
  process.exit(1);
}

let serviceKey = null;
if (fs.existsSync(envPath)) {
  const match = /^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+?)\s*$/m.exec(fs.readFileSync(envPath, 'utf8'));
  if (match && match[1].length > 10) serviceKey = match[1].replace(/^["']|["']$/g, '');
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function isServiceRoleJwt(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return payload?.role === 'service_role';
  } catch {
    return false;
  }
}

const problems = [];
let scanned = 0;
for (const file of walk(distDir)) {
  if (!/\.(js|css|html|json|map|txt)$/.test(file)) continue;
  scanned += 1;
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  if (serviceKey && text.includes(serviceKey)) problems.push(`${rel}: contains SUPABASE_SERVICE_ROLE_KEY`);
  if (/sb_secret_[A-Za-z0-9_-]{10,}/.test(text)) problems.push(`${rel}: contains an sb_secret_ key`);
  for (const jwt of text.match(/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g) ?? []) {
    if (isServiceRoleJwt(jwt)) problems.push(`${rel}: contains a service_role JWT`);
  }
}

if (problems.length) {
  console.error('[verify:bundle] Secrets found in the client bundle:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`[verify:bundle] OK - scanned ${scanned} files in client/dist, no server secrets found.`);
