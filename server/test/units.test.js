import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectImageType, normalizeMime } from '../src/utils/fileValidation.js';
import { createMessageBody, listMessagesQuery } from '../src/validators/schemas.js';
import { assertConversationAccess } from '../src/services/conversationService.js';
import { ConfigError, parseEnv } from '../src/config/env.js';

const pad = (bytes) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(16)]);

test('detectImageType recognises JPEG, PNG and WEBP by magic bytes', () => {
  assert.equal(detectImageType(pad([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg');
  assert.equal(detectImageType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png');
  const webp = Buffer.alloc(16);
  webp.write('RIFF', 0, 'ascii');
  webp.write('WEBP', 8, 'ascii');
  assert.equal(detectImageType(webp), 'image/webp');
  assert.equal(detectImageType(pad([0x47, 0x49, 0x46, 0x38])), null);
  assert.equal(detectImageType(Buffer.from('short')), null);
  assert.equal(normalizeMime('image/JPG'), 'image/jpeg');
});

test('createMessageBody requires text and/or an attachment', () => {
  const clientId = '11111111-1111-4111-8111-111111111111';
  assert.equal(createMessageBody.safeParse({ clientId }).success, false);
  assert.equal(createMessageBody.safeParse({ clientId, content: ' \n ' }).success, false);
  assert.equal(createMessageBody.safeParse({ clientId, content: 'x'.repeat(4001) }).success, false);

  const ok = createMessageBody.parse({ clientId, content: '  Hello\r\nthere\u0007 ' });
  assert.equal(ok.content, 'Hello\nthere');
  assert.equal(ok.attachmentPath, null);

  const path = `conversations/${clientId}/${clientId}/${clientId}.png`;
  assert.equal(createMessageBody.parse({ clientId, attachmentPath: path }).attachmentPath, path);
  assert.equal(createMessageBody.safeParse({ clientId, attachmentPath: '../../etc/passwd' }).success, false);
});

test('listMessagesQuery accepts Postgres timestamps as cursors', () => {
  const q = listMessagesQuery.parse({ before: '2026-10-29T10:00:00.123456+00:00', limit: '20' });
  assert.equal(q.limit, 20);
  assert.equal(listMessagesQuery.safeParse({ before: 'yesterday' }).success, false);
  assert.equal(
    listMessagesQuery.safeParse({ before: '2026-10-29T10:00:00Z', after: '2026-10-29T09:00:00Z' }).success,
    false,
  );
});

test('assertConversationAccess enforces ownership', () => {
  const conv = { id: 'c1', user_id: 'owner' };
  const as = (id, role) => ({ user: { id }, role });
  assert.equal(assertConversationAccess(conv, as('owner', 'user')), conv);
  assert.equal(assertConversationAccess(conv, as('someone', 'ai_operator')), conv);
  assert.throws(() => assertConversationAccess(conv, as('intruder', 'user')), { status: 404 });
  assert.throws(() => assertConversationAccess(null, as('owner', 'user')), { status: 404 });
});

test('parseEnv reports missing and misconfigured variables clearly', () => {
  assert.throws(() => parseEnv({}), ConfigError);
  assert.throws(
    () => parseEnv({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'sb_publishable_abcdefghijklmnopqrstuvwxyz' }),
    /not the publishable key/,
  );
  const env = parseEnv({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'a'.repeat(40), CLIENT_ORIGIN: 'http://a.test/, http://b.test' });
  assert.deepEqual(env.clientOrigins, ['http://a.test', 'http://b.test']);
  assert.equal(env.maxUploadBytes, 5 * 1024 * 1024);
});
