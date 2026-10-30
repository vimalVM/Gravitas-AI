import { HttpError, dbError } from '../utils/httpError.js';

const MESSAGE_COLUMNS =
  'id, conversation_id, sender_id, sender_role, client_id, content, message_type, ' +
  'attachment_path, attachment_mime, attachment_size, created_at';

/** Builds the only storage path a sender may use for a given message. */
export function attachmentPathPrefix(conversationId, senderId, clientId) {
  return `conversations/${conversationId}/${senderId}/${clientId}.`;
}

function toApi(row, signed) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    clientId: row.client_id,
    content: row.content,
    type: row.message_type,
    attachment: row.attachment_path
      ? {
          path: row.attachment_path,
          mime: row.attachment_mime,
          size: row.attachment_size,
          url: signed?.url ?? null,
          urlExpiresAt: signed?.expiresAt ?? null,
        }
      : null,
    createdAt: row.created_at,
  };
}

export function createMessageService({ supabase, storage }) {
  async function withSignedUrls(rows) {
    const signed = await storage.signMany(rows.map((r) => r.attachment_path));
    return rows.map((row) => toApi(row, signed.get(row.attachment_path)));
  }

  async function findByClientId(conversationId, clientId) {
    const { data, error } = await supabase
      .from('messages')
      .select(MESSAGE_COLUMNS)
      .eq('conversation_id', conversationId)
      .eq('client_id', clientId)
      .maybeSingle();
    if (error) throw dbError(error, 'load message');
    return data;
  }

  return {
    findByClientId,

    async getById(id) {
      const { data, error } = await supabase.from('messages').select(MESSAGE_COLUMNS).eq('id', id).maybeSingle();
      if (error) throw dbError(error, 'load message');
      return data;
    },

    /**
     * Keyset pagination by created_at.
     *   before -> older page (returned oldest-first)
     *   after  -> messages newer than the cursor (gap filling after reconnects)
     */
    async list(conversationId, { before, after, limit }) {
      let query = supabase.from('messages').select(MESSAGE_COLUMNS).eq('conversation_id', conversationId);

      if (after) {
        query = query.gt('created_at', after).order('created_at', { ascending: true }).order('id', { ascending: true });
      } else {
        if (before) query = query.lt('created_at', before);
        query = query.order('created_at', { ascending: false }).order('id', { ascending: false });
      }

      const { data, error } = await query.limit(limit + 1);
      if (error) throw dbError(error, 'list messages');

      const rows = data ?? [];
      const hasMore = rows.length > limit;
      const page = rows.slice(0, limit);
      if (!after) page.reverse();
      return { messages: await withSignedUrls(page), hasMore };
    },

    /**
     * Creates a message as the authenticated account. Idempotent on clientId:
     * retrying the same clientId returns the original message instead of a
     * duplicate. Returns { message, created }.
     */
    async create(conversation, auth, { clientId, content, attachmentPath }) {
      let attachment = null;
      if (attachmentPath) {
        if (!attachmentPath.startsWith(attachmentPathPrefix(conversation.id, auth.user.id, clientId))) {
          throw new HttpError(400, 'INVALID_ATTACHMENT', 'This attachment does not belong to this message.');
        }
        const object = await storage.find(attachmentPath);
        if (!object) {
          throw new HttpError(400, 'ATTACHMENT_NOT_FOUND', 'The image upload was not found. Please attach it again.');
        }
        attachment = {
          mime: object.metadata?.mimetype ?? null,
          size: object.metadata?.size ?? object.metadata?.contentLength ?? null,
        };
      }

      const row = {
        conversation_id: conversation.id,
        sender_id: auth.user.id,
        sender_role: auth.role,
        client_id: clientId,
        content,
        message_type: attachmentPath ? 'image' : 'text',
        attachment_path: attachmentPath,
        attachment_mime: attachment?.mime ?? null,
        attachment_size: attachment?.size || null,
      };

      const { data, error } = await supabase.from('messages').insert(row).select(MESSAGE_COLUMNS).single();

      if (error?.code === '23505') {
        const existing = await findByClientId(conversation.id, clientId);
        if (!existing || existing.sender_id !== auth.user.id) {
          throw new HttpError(409, 'DUPLICATE_MESSAGE', 'This message id is already in use.');
        }
        const [message] = await withSignedUrls([existing]);
        return { message, created: false };
      }
      if (error) throw dbError(error, 'create message');

      const [message] = await withSignedUrls([data]);
      return { message, created: true };
    },
  };
}
