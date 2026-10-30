import { Router } from 'express';
import { createMessageController } from '../controllers/messageController.js';

/** Mounted at /api/conversations/:conversationId/messages (after authentication). */
export function conversationMessagesRouter({ services, limiters }) {
  const router = Router({ mergeParams: true });
  const controller = createMessageController(services);

  router.get('/', controller.list);
  router.post('/', limiters.messages, controller.create);

  return router;
}

/** Mounted at /api/messages */
export function messagesRouter({ services, authenticateRequest }) {
  const router = Router();
  const controller = createMessageController(services);

  router.use(authenticateRequest);
  router.get('/:messageId/attachment', controller.getAttachment);

  return router;
}
