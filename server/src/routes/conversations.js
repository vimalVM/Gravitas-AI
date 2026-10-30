import { Router } from 'express';
import { requireRole } from '../middleware/authorize.js';
import { createConversationController } from '../controllers/conversationController.js';
import { conversationMessagesRouter } from './messages.js';

export function conversationsRouter({ services, authenticateRequest, limiters }) {
  const router = Router();
  const controller = createConversationController(services);

  router.use(authenticateRequest);
  router.get('/', controller.list);
  router.post('/', requireRole('user'), controller.ensureCurrent);
  router.get('/:conversationId', controller.getOne);
  router.post('/:conversationId/read', controller.markRead);
  router.use('/:conversationId/messages', conversationMessagesRouter({ services, limiters }));

  return router;
}
