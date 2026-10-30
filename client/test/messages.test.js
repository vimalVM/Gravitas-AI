import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMessageRows, isOwnMessage, mergeMessages, normalizeMessage } from '../src/utils/messages.js';
import { formatDayLabel } from '../src/utils/date.js';
import { validateImageFile } from '../src/utils/files.js';
import { createUuid, initialsOf } from '../src/utils/ids.js';

const user = { id: 'user-1', role: 'user' };
const operator = { id: 'op-1', role: 'ai_operator' };
const otherOperator = { id: 'op-2', role: 'ai_operator' };

const fromUser = { id: 'm1', clientId: 'c1', senderId: 'user-1', senderRole: 'user', createdAt: '2026-10-29T10:31:00Z' };
const fromAi = { id: 'm2', clientId: 'c2', senderId: 'op-1', senderRole: 'ai_operator', createdAt: '2026-10-29T10:32:00Z' };
const welcome = { id: 'm0', clientId: 'c0', senderId: null, senderRole: 'ai_operator', createdAt: '2026-10-29T10:30:00Z' };

test('user view: own messages right, Gravitas AI left', () => {
  assert.equal(isOwnMessage(fromUser, user), true);
  assert.equal(isOwnMessage(fromAi, user), false);
  assert.equal(isOwnMessage(welcome, user), false);
});

test('operator view: user messages left, Gravitas AI messages right', () => {
  assert.equal(isOwnMessage(fromUser, operator), false);
  assert.equal(isOwnMessage(fromAi, operator), true);
  assert.equal(isOwnMessage(fromAi, otherOperator), true);
  assert.equal(isOwnMessage(welcome, operator), true);
});

test('another user can never be "own"', () => {
  assert.equal(isOwnMessage(fromUser, { id: 'user-2', role: 'user' }), false);
});

test('mergeMessages replaces optimistic placeholders and ignores duplicate events', () => {
  const optimistic = { id: null, clientId: 'c9', senderId: 'user-1', senderRole: 'user', createdAt: '2026-10-29T10:40:00Z', status: 'sending', localPreviewUrl: 'blob:x' };
  let list = mergeMessages([fromUser], [optimistic]);
  assert.equal(list.length, 2);

  const confirmed = { ...optimistic, id: 'm9', status: 'sent', localPreviewUrl: null };
  list = mergeMessages(list, [confirmed]);
  list = mergeMessages(list, [confirmed]); // duplicate realtime event
  assert.equal(list.length, 2);
  assert.equal(list[1].id, 'm9');
  assert.equal(list[1].localPreviewUrl, 'blob:x');
});

test('mergeMessages keeps chronological order and pending messages last', () => {
  const pending = { id: null, clientId: 'p', senderRole: 'user', createdAt: '2026-10-29T09:00:00Z' };
  const list = mergeMessages([], [fromAi, pending, welcome, fromUser]);
  assert.deepEqual(list.map((m) => m.id ?? 'pending'), ['m0', 'm1', 'm2', 'pending']);
});

test('normalizeMessage handles REST and Realtime shapes', () => {
  const rest = normalizeMessage({ id: '1', clientId: 'c', conversationId: 'k', senderId: 's', senderRole: 'user', content: 'hi', type: 'image', attachment: { path: 'p', url: 'u' }, createdAt: 't' });
  const realtime = normalizeMessage({ id: '1', client_id: 'c', conversation_id: 'k', sender_id: 's', sender_role: 'user', content: 'hi', message_type: 'image', attachment_path: 'p', created_at: 't' });
  assert.equal(rest.attachmentUrl, 'u');
  assert.equal(realtime.attachmentUrl, null);
  assert.deepEqual({ ...rest, attachmentUrl: null }, realtime);
});

test('buildMessageRows inserts date separators and sender runs', () => {
  const now = new Date('2026-10-29T12:00:00');
  const yesterday = { ...fromUser, id: 'y', clientId: 'y', createdAt: new Date('2026-10-28T09:00:00').toISOString() };
  const rows = buildMessageRows([yesterday, { ...fromUser, createdAt: new Date('2026-10-29T10:31:00').toISOString() }, { ...fromAi, createdAt: new Date('2026-10-29T10:32:00').toISOString() }], user, now);
  assert.deepEqual(rows.map((r) => r.type), ['date', 'message', 'date', 'message', 'message']);
  assert.equal(rows[0].label, 'Yesterday');
  assert.equal(rows[2].label, 'Today');
  assert.equal(rows[3].own, true);
  assert.equal(rows[4].own, false);
  assert.equal(rows[4].startsRun, true);
});

test('formatDayLabel uses full dates for older days', () => {
  assert.equal(formatDayLabel(new Date('2026-10-20T10:00:00'), new Date('2026-10-29T10:00:00')), '20 October 2026');
});

test('validateImageFile rejects unsupported and oversized files', () => {
  const max = 5 * 1024 * 1024;
  assert.equal(validateImageFile({ type: 'image/png', size: 1000, name: 'a.png' }, max), null);
  assert.match(validateImageFile({ type: 'image/gif', size: 1000, name: 'a.gif' }, max), /Only JPEG/);
  assert.match(validateImageFile({ type: 'image/jpeg', size: max + 1, name: 'a.jpg' }, max), /or smaller/);
});

test('helpers: uuid and initials', () => {
  assert.match(createUuid(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(initialsOf('Ada  Lovelace'), 'AL');
  assert.equal(initialsOf(''), '?');
});
