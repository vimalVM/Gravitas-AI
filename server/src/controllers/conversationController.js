import { conversationParams, listConversationsQuery } from '../validators/schemas.js';

export function createConversationController({ conversations }) {
  return {
    async list(req, res) {
      const query = listConversationsQuery.parse(req.query);
      res.json({ data: { conversations: await conversations.list(req.auth, query) } });
    },

    /** Users: get-or-create the conversation for the active project. */
    async ensureCurrent(req, res) {
      res.json({ data: { conversation: await conversations.ensureForUser(req.auth) } });
    },

    async getOne(req, res) {
      const { conversationId } = conversationParams.parse(req.params);
      const conversation = await conversations.getAuthorized(conversationId, req.auth);
      res.json({ data: { conversation: await conversations.toDetailed(conversation, req.auth) } });
    },

    async markRead(req, res) {
      const { conversationId } = conversationParams.parse(req.params);
      await conversations.getAuthorized(conversationId, req.auth);
      res.json({ data: { lastReadAt: await conversations.markRead(conversationId, req.auth) } });
    },
  };
}
