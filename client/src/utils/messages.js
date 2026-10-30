import { dayKey, formatDayLabel } from './date.js';

/**
 * Normalises a message from the REST API (camelCase) or a Realtime
 * postgres_changes payload (snake_case) into one client-side shape.
 */
export function normalizeMessage(raw) {
  const attachmentPath = raw.attachment?.path ?? raw.attachment_path ?? null;
  return {
    id: raw.id ?? null,
    clientId: raw.clientId ?? raw.client_id ?? null,
    conversationId: raw.conversationId ?? raw.conversation_id,
    senderId: raw.senderId ?? raw.sender_id ?? null,
    senderRole: raw.senderRole ?? raw.sender_role,
    content: raw.content ?? null,
    type: raw.type ?? raw.message_type ?? (attachmentPath ? 'image' : 'text'),
    attachmentPath,
    attachmentUrl: raw.attachment?.url ?? null,
    createdAt: raw.createdAt ?? raw.created_at,
    status: 'sent',
  };
}

/**
 * Decides which side of the chat a message belongs on.
 * A message is "own" (right side) when its sender id matches the signed-in
 * account. Operators share the Gravitas AI persona, so in the operator
 * console every Gravitas AI message (including replies from another operator
 * and the automated welcome message) is shown as sent by "us".
 */
export function isOwnMessage(message, viewer) {
  if (!viewer || !message) return false;
  if (message.senderId && message.senderId === viewer.id) return true;
  return viewer.role === 'ai_operator' && message.senderRole === 'ai_operator';
}

export const messageKey = (message) => message.id ?? `tmp:${message.clientId}`;

function compareMessages(a, b) {
  // Messages still being sent stay at the bottom, in the order they were written.
  if (!a.id !== !b.id) return a.id ? -1 : 1;
  const t = new Date(a.createdAt) - new Date(b.createdAt);
  if (t !== 0) return t;
  return String(a.id ?? a.clientId).localeCompare(String(b.id ?? b.clientId));
}

/**
 * Merges incoming messages into the current list without duplicates.
 * - The same message delivered twice (REST + Realtime) is merged by id.
 * - A confirmed message replaces its optimistic placeholder (same clientId).
 */
export function mergeMessages(current, incoming) {
  const byKey = new Map(current.map((m) => [messageKey(m), m]));

  for (const message of incoming) {
    const tempKey = `tmp:${message.clientId}`;
    if (message.id && message.clientId && byKey.has(tempKey)) {
      const placeholder = byKey.get(tempKey);
      byKey.delete(tempKey);
      byKey.set(message.id, { ...message, localPreviewUrl: placeholder.localPreviewUrl ?? null });
      continue;
    }

    const key = messageKey(message);
    const existing = byKey.get(key);
    byKey.set(
      key,
      existing
        ? {
            ...existing,
            ...message,
            attachmentUrl: message.attachmentUrl ?? existing.attachmentUrl ?? null,
            localPreviewUrl: existing.localPreviewUrl ?? message.localPreviewUrl ?? null,
          }
        : message,
    );
  }

  return [...byKey.values()].sort(compareMessages);
}

const GROUP_GAP_MS = 5 * 60 * 1000;

/**
 * Turns a sorted message list into render rows: date separators plus
 * messages flagged with whether they start a new sender "run".
 */
export function buildMessageRows(messages, viewer, now = new Date()) {
  const rows = [];
  let previous = null;
  let previousDay = null;

  for (const message of messages) {
    const day = dayKey(message.createdAt);
    if (day !== previousDay) {
      rows.push({ type: 'date', key: `date:${day}`, label: formatDayLabel(message.createdAt, now) });
      previous = null;
      previousDay = day;
    }

    const own = isOwnMessage(message, viewer);
    const startsRun =
      !previous ||
      isOwnMessage(previous, viewer) !== own ||
      previous.senderRole !== message.senderRole ||
      new Date(message.createdAt) - new Date(previous.createdAt) > GROUP_GAP_MS;

    rows.push({ type: 'message', key: messageKey(message), message, own, startsRun });
    previous = message;
  }
  return rows;
}

/** Latest confirmed (server) message, used as the cursor for gap filling. */
export function newestConfirmed(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) if (messages[i].id) return messages[i];
  return null;
}

export function oldestConfirmed(messages) {
  return messages.find((m) => m.id) ?? null;
}
