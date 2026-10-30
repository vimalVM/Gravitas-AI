import { Router } from 'express';
import { imageUpload } from '../middleware/upload.js';
import { createAuthController } from '../controllers/authController.js';

export function authRouter({ env, services, authenticateRequest, limiters }) {
  const router = Router();
  const controller = createAuthController(services);

  router.use(authenticateRequest);
  router.get('/me', controller.getMe);
  router.get('/role', controller.getRole);
  router.patch('/me', limiters.profile, controller.updateMe);
  router.post('/me/avatar', limiters.uploads, imageUpload(env, 'avatar'), controller.uploadAvatar);

  return router;
}
