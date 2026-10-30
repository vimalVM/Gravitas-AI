import { HttpError, notFound } from '../utils/httpError.js';
import { conversationParams, createMessageBody, listMessagesQuery, messageParams } from '../validators/schemas.js';

export function createMessageController({ conversations, messages, storage }) {
  return {
    async list(req, res) {
      const { conversationId } = conversationParams.parse(req.params);
      const query = listMessagesQuery.parse(req.query);
      await conversations.getAuthorized(conversationId, req.auth);
      res.json({ data: await messages.list(conversationId, query) });
    },

    async create(req, res) {
      const { conversationId } = conversationParams.parse(req.params);
      const body = createMessageBody.parse(req.body ?? {});
      const conversation = await conversations.getAuthorized(conversationId, req.auth);
      const { message, created } = await messages.create(conversation, req.auth, body);
      res.status(created ? 201 : 200).json({ data: { message } });
    },

    /** Fresh signed URL for an image message (e.g. one delivered via Realtime). */
    async getAttachment(req, res) {
      const { messageId } = messageParams.parse(req.params);
      const message = await messages.getById(messageId);
      if (!message) throw notFound('Message not found.');
      await conversations.getAuthorized(message.conversation_id, req.auth);
      if (!message.attachment_path) throw notFound('This message has no attachment.');

      const signed = await storage.signOne(message.attachment_path);
      if (!signed) throw new HttpError(404, 'ATTACHMENT_MISSING', 'This image is no longer available.');
      res.json({ data: { url: signed.url, expiresAt: signed.expiresAt } });
    },
  };
}
