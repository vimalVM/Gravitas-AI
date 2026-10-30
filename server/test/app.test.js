import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { parseEnv } from '../src/config/env.js';
import { createFakeSupabase } from './helpers/fakeSupabase.js';

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';
const OPERATOR = '33333333-3333-4333-8333-333333333333';
const CONV_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CONV_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const env = parseEnv({
  NODE_ENV: 'test',
  CLIENT_ORIGIN: 'http://localhost:5173',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key-not-real',
});

function conversation(id, userId) {
  return { id, user_id: userId, title: 'Gravitas AI', project_name: 'Project AETHER-218', project_code: 'GRV-2.18', status: 'in_progress' };
}

const supabase = createFakeSupabase({
  users: {
    'token-a': { id: USER_A, email: 'a@example.com' },
    'token-b': { id: USER_B, email: 'b@example.com' },
    'token-op': { id: OPERATOR, email: 'op@example.com' },
  },
  tables: {
    profiles: [
      { id: USER_A, display_name: 'User A', role: 'user', avatar_path: null },
      { id: USER_B, display_name: 'User B', role: 'user', avatar_path: null },
      { id: OPERATOR, display_name: 'Operator', role: 'ai_operator', avatar_path: null },
    ],
    conversations: [conversation(CONV_A, USER_A), conversation(CONV_B, USER_B)],
    messages: [],
  },
});

const app = createApp({ env, supabase });
const auth = (token) => ({ Authorization: `Bearer ${token}` });

test('GET /api/health responds without authentication', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'ok');
});

test('protected endpoints reject missing and invalid tokens', async () => {
  const missing = await request(app).get('/api/auth/me');
  assert.equal(missing.status, 401);
  assert.equal(missing.body.error.code, 'AUTH_REQUIRED');

  const invalid = await request(app).get('/api/auth/me').set(auth('forged-token'));
  assert.equal(invalid.status, 401);
  assert.equal(invalid.body.error.code, 'INVALID_SESSION');
});

test('role is derived from the verified token, not the request', async () => {
  const res = await request(app).get('/api/auth/role').set(auth('token-a')).query({ role: 'ai_operator' });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.role, 'user');
});

test('users cannot read another user\'s conversation or messages', async () => {
  const conv = await request(app).get(`/api/conversations/${CONV_B}`).set(auth('token-a'));
  assert.equal(conv.status, 404);

  const msgs = await request(app).get(`/api/conversations/${CONV_B}/messages`).set(auth('token-a'));
  assert.equal(msgs.status, 404);

  const send = await request(app)
    .post(`/api/conversations/${CONV_B}/messages`)
    .set(auth('token-a'))
    .send({ clientId: '44444444-4444-4444-8444-444444444444', content: 'hi' });
  assert.equal(send.status, 404);
});

test('users can read their own messages; operators can read any conversation', async () => {
  const own = await request(app).get(`/api/conversations/${CONV_A}/messages`).set(auth('token-a'));
  assert.equal(own.status, 200);
  assert.deepEqual(own.body.data, { messages: [], hasMore: false });

  const operator = await request(app).get(`/api/conversations/${CONV_B}/messages`).set(auth('token-op'));
  assert.equal(operator.status, 200);
});

test('only ordinary users may create their project conversation', async () => {
  const res = await request(app).post('/api/conversations').set(auth('token-op'));
  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, 'FORBIDDEN');
});

test('message bodies are validated and sender fields are rejected', async () => {
  const empty = await request(app)
    .post(`/api/conversations/${CONV_A}/messages`)
    .set(auth('token-a'))
    .send({ clientId: '55555555-5555-4555-8555-555555555555', content: '   ' });
  assert.equal(empty.status, 400);
  assert.equal(empty.body.error.code, 'VALIDATION_ERROR');

  const spoofed = await request(app)
    .post(`/api/conversations/${CONV_A}/messages`)
    .set(auth('token-a'))
    .send({ clientId: '55555555-5555-4555-8555-555555555555', content: 'hi', senderId: OPERATOR, senderRole: 'ai_operator' });
  assert.equal(spoofed.status, 400);
});

test('attachments must belong to the sender and conversation', async () => {
  const clientId = '66666666-6666-4666-8666-666666666666';
  const res = await request(app)
    .post(`/api/conversations/${CONV_A}/messages`)
    .set(auth('token-a'))
    .send({ clientId, attachmentPath: `conversations/${CONV_A}/${USER_B}/${clientId}.png` });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'INVALID_ATTACHMENT');
});

test('uploads reject unsupported file types', async () => {
  const res = await request(app)
    .post('/api/uploads/images')
    .set(auth('token-a'))
    .field('conversationId', CONV_A)
    .field('clientId', '77777777-7777-4777-8777-777777777777')
    .attach('image', Buffer.from('GIF89a........'), { filename: 'x.gif', contentType: 'image/gif' });
  assert.equal(res.status, 415);
});

test('uploads reject files whose content is not an image', async () => {
  const res = await request(app)
    .post('/api/uploads/images')
    .set(auth('token-a'))
    .field('conversationId', CONV_A)
    .field('clientId', '77777777-7777-4777-8777-777777777777')
    .attach('image', Buffer.from('<html><script>alert(1)</script></html>'), { filename: 'fake.png', contentType: 'image/png' });
  assert.equal(res.status, 415);
});

test('uploads reject oversized files', async () => {
  const big = Buffer.alloc(env.maxUploadBytes + 10, 0);
  big.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const res = await request(app)
    .post('/api/uploads/images')
    .set(auth('token-a'))
    .field('conversationId', CONV_A)
    .field('clientId', '77777777-7777-4777-8777-777777777777')
    .attach('image', big, { filename: 'big.png', contentType: 'image/png' });
  assert.equal(res.status, 413);
  assert.equal(res.body.error.code, 'FILE_TOO_LARGE');
});

test('CORS rejects unknown origins and allows the configured client', async () => {
  const bad = await request(app).get('/api/health').set('Origin', 'https://evil.example');
  assert.equal(bad.status, 403);

  const good = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
  assert.equal(good.status, 200);
  assert.equal(good.headers['access-control-allow-origin'], 'http://localhost:5173');
});

test('unknown routes return a JSON 404 and never leak secrets', async () => {
  const res = await request(app).get('/api/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'ROUTE_NOT_FOUND');
  assert.ok(!JSON.stringify(res.body).includes(env.serviceRoleKey));
});
