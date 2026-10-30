import { fetchMessages, postMessage, uploadChatImage } from './chatApi';
import { mergeMessages, newestConfirmed, normalizeMessage, oldestConfirmed } from '../utils/messages';
import { createUuid } from '../utils/ids';

/**
 * Per-conversation message cache that lives outside React, so in-flight
 * sends keep updating correctly when the user switches conversations, and
 * reopening a conversation is instant.
 */
const EMPTY = Object.freeze({ items: [], status: 'idle', error: null, hasMore: false, loadingOlder: false, loaded: false });

const states = new Map();
const listeners = new Map();
const pendingJobs = new Map(); // clientId -> { conversationId, text, file, attachmentPath, inFlight }
const objectUrls = new Set();

export const messageStore = {
  get(conversationId) {
    return states.get(conversationId) ?? EMPTY;
  },
  subscribe(conversationId, listener) {
    if (!listeners.has(conversationId)) listeners.set(conversationId, new Set());
    listeners.get(conversationId).add(listener);
    return () => listeners.get(conversationId)?.delete(listener);
  },
  update(conversationId, updater) {
    states.set(conversationId, updater(this.get(conversationId)));
    listeners.get(conversationId)?.forEach((listener) => listener());
  },
  /** Clears everything (used on sign-out). */
  reset() {
    states.clear();
    pendingJobs.clear();
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.clear();
    listeners.forEach((set) => set.forEach((listener) => listener()));
  },
};

export function ingestMessages(conversationId, rawMessages) {
  if (!rawMessages.length) return;
  const incoming = rawMessages.map((m) => (m.status ? m : normalizeMessage(m)));
  messageStore.update(conversationId, (s) => ({ ...s, items: mergeMessages(s.items, incoming) }));
}

function patchPending(conversationId, clientId, patch) {
  messageStore.update(conversationId, (s) => ({
    ...s,
    items: s.items.map((m) => (!m.id && m.clientId === clientId ? { ...m, ...patch } : m)),
  }));
}

const inflightLoads = new Map();

export function loadInitialMessages(conversationId) {
  if (inflightLoads.has(conversationId)) return inflightLoads.get(conversationId);
  messageStore.update(conversationId, (s) => ({ ...s, status: s.loaded ? s.status : 'loading', error: null }));

  const promise = fetchMessages(conversationId, { limit: 30 })
    .then(({ messages, hasMore }) => {
      messageStore.update(conversationId, (s) => ({
        ...s,
        items: mergeMessages(s.items, messages.map(normalizeMessage)),
        hasMore,
        loaded: true,
        status: 'ready',
        error: null,
      }));
    })
    .catch((error) => {
      messageStore.update(conversationId, (s) => ({ ...s, status: s.loaded ? 'ready' : 'error', error }));
    })
    .finally(() => inflightLoads.delete(conversationId));

  inflightLoads.set(conversationId, promise);
  return promise;
}

/** Fetches anything newer than what we have (after reconnecting or coming back online). */
export async function fetchNewerMessages(conversationId) {
  const state = messageStore.get(conversationId);
  if (!state.loaded) return loadInitialMessages(conversationId);
  const newest = newestConfirmed(state.items);
  if (!newest) return loadInitialMessages(conversationId);

  try {
    let cursor = newest.createdAt;
    for (let page = 0; page < 5; page += 1) {
      const { messages, hasMore } = await fetchMessages(conversationId, { after: cursor, limit: 100 });
      ingestMessages(conversationId, messages);
      if (!hasMore || !messages.length) break;
      cursor = messages[messages.length - 1].createdAt;
    }
  } catch (error) {
    console.warn('[messages] could not fetch newer messages:', error.message);
  }
}

export async function loadOlderMessages(conversationId) {
  const state = messageStore.get(conversationId);
  const oldest = oldestConfirmed(state.items);
  if (!state.hasMore || state.loadingOlder || !oldest) return;

  messageStore.update(conversationId, (s) => ({ ...s, loadingOlder: true }));
  try {
    const { messages, hasMore } = await fetchMessages(conversationId, { before: oldest.createdAt, limit: 30 });
    messageStore.update(conversationId, (s) => ({
      ...s,
      items: mergeMessages(s.items, messages.map(normalizeMessage)),
      hasMore,
      loadingOlder: false,
    }));
  } catch (error) {
    messageStore.update(conversationId, (s) => ({ ...s, loadingOlder: false }));
    throw error;
  }
}

async function deliver(clientId) {
  const job = pendingJobs.get(clientId);
  if (!job || job.inFlight) return { ok: true };
  job.inFlight = true;
  const { conversationId } = job;
  patchPending(conversationId, clientId, { status: 'sending', error: null });

  try {
    if (job.file && !job.attachmentPath) {
      const upload = await uploadChatImage({
        conversationId,
        clientId,
        file: job.file,
        onProgress: (progress) => patchPending(conversationId, clientId, { progress }),
      });
      job.attachmentPath = upload.path;
    }
    const message = await postMessage(conversationId, { clientId, content: job.text, attachmentPath: job.attachmentPath });
    pendingJobs.delete(clientId);
    ingestMessages(conversationId, [message]);
    return { ok: true };
  } catch (error) {
    job.inFlight = false;
    patchPending(conversationId, clientId, {
      status: 'failed',
      error: error.message,
      retryable: Boolean(error.retryable),
      offline: Boolean(error.isNetwork),
    });
    return { ok: false, error };
  }
}

/** Optimistically adds a message and delivers it (upload first when an image is attached). */
export function sendMessage(conversationId, viewer, { text, file }) {
  const clientId = createUuid();
  let localPreviewUrl = null;
  if (file) {
    localPreviewUrl = URL.createObjectURL(file);
    objectUrls.add(localPreviewUrl);
  }

  pendingJobs.set(clientId, { conversationId, text: text || null, file: file ?? null, attachmentPath: null, inFlight: false });
  ingestMessages(conversationId, [
    {
      id: null,
      clientId,
      conversationId,
      senderId: viewer.id,
      senderRole: viewer.role,
      content: text || null,
      type: file ? 'image' : 'text',
      attachmentPath: null,
      attachmentUrl: null,
      localPreviewUrl,
      createdAt: new Date().toISOString(),
      status: 'sending',
      progress: file ? 0 : null,
      error: null,
    },
  ]);
  return deliver(clientId);
}

export const retryMessage = (clientId) => deliver(clientId);

export function discardMessage(conversationId, clientId) {
  pendingJobs.delete(clientId);
  messageStore.update(conversationId, (s) => ({ ...s, items: s.items.filter((m) => m.id || m.clientId !== clientId) }));
}

/** Retries messages that failed because the device was offline. */
export function retryOfflineMessages(conversationId) {
  for (const message of messageStore.get(conversationId).items) {
    if (!message.id && message.status === 'failed' && message.offline) deliver(message.clientId);
  }
}
