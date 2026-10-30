import { Router } from 'express';
import { imageUpload } from '../middleware/upload.js';
import { createUploadController } from '../controllers/uploadController.js';

export function uploadsRouter({ env, services, authenticateRequest, limiters }) {
  const router = Router();
  const controller = createUploadController(services);

  router.use(authenticateRequest);
  router.post('/images', limiters.uploads, imageUpload(env, 'image'), controller.uploadImage);

  return router;
}
