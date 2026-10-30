import { apiRequest, apiUpload } from './api';

// ---- Profile -------------------------------------------------------------
export const fetchMyProfile = () => apiRequest('/auth/me').then((d) => d.profile);

export const updateMyProfile = (displayName) =>
  apiRequest('/auth/me', { method: 'PATCH', body: { displayName } }).then((d) => d.profile);

export function uploadMyAvatar(file, onProgress) {
  const form = new FormData();
  form.append('avatar', file);
  return apiUpload('/auth/me/avatar', form, { onProgress }).then((d) => d.profile);
}

// ---- Conversations -------------------------------------------------------
export const ensureMyConversation = () =>
  apiRequest('/conversations', { method: 'POST' }).then((d) => d.conversation);

export function listConversations({ search, limit = 100 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (search) params.set('search', search);
  return apiRequest(`/conversations?${params}`).then((d) => d.conversations);
}

export const fetchConversation = (id) => apiRequest(`/conversations/${id}`).then((d) => d.conversation);

export const markConversationRead = (id) =>
  apiRequest(`/conversations/${id}/read`, { method: 'POST' }).then((d) => d.lastReadAt);

// ---- Messages --------------------------------------------------------------
export function fetchMessages(conversationId, { before, after, limit = 30 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set('before', before);
  if (after) params.set('after', after);
  return apiRequest(`/conversations/${conversationId}/messages?${params}`);
}

export const postMessage = (conversationId, { clientId, content, attachmentPath }) =>
  apiRequest(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: { clientId, content: content || null, attachmentPath: attachmentPath || null },
  }).then((d) => d.message);

export function uploadChatImage({ conversationId, clientId, file, onProgress }) {
  const form = new FormData();
  form.append('conversationId', conversationId);
  form.append('clientId', clientId);
  form.append('image', file);
  return apiUpload('/uploads/images', form, { onProgress });
}

export const fetchAttachmentUrl = (messageId) => apiRequest(`/messages/${messageId}/attachment`);
