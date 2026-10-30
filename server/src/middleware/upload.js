import multer from 'multer';
import { HttpError } from '../utils/httpError.js';
import { IMAGE_TYPES, normalizeMime } from '../utils/fileValidation.js';

/**
 * Accepts a single in-memory image upload in `fieldName`. The declared MIME
 * type is checked here; the real content type is verified from the file's
 * bytes in the controller.
 */
export function imageUpload(env, fieldName) {
  const handler = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.maxUploadBytes, files: 1, fields: 5, fieldSize: 1024 },
    fileFilter(_req, file, cb) {
      if (!IMAGE_TYPES[normalizeMime(file.mimetype)]) {
        cb(new HttpError(415, 'UNSUPPORTED_FILE_TYPE', 'Only JPEG, PNG and WEBP images are supported.'));
        return;
      }
      cb(null, true);
    },
  }).single(fieldName);

  return function parseImageUpload(req, res, next) {
    handler(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new HttpError(413, 'FILE_TOO_LARGE', `Images must be ${env.maxUploadMb} MB or smaller.`));
        }
        return next(new HttpError(400, 'INVALID_UPLOAD', 'The upload could not be processed. Attach one image and try again.'));
      }
      return next(err);
    });
  };
}
