import { HttpError } from '../utils/httpError.js';
import { IMAGE_TYPES, detectImageType } from '../utils/fileValidation.js';
import { uploadImageBody } from '../validators/schemas.js';
import { attachmentPathPrefix } from '../services/messageService.js';

export function createUploadController({ conversations, messages, storage }) {
  return {
    /**
     * Stores a chat image at a deterministic path derived from the message's
     * clientId, so retrying an upload overwrites the same object instead of
     * creating duplicates. Returns the path to reference when sending the message.
     */
    async uploadImage(req, res) {
      if (!req.file) throw new HttpError(400, 'FILE_REQUIRED', 'Choose an image to upload.');
      const { conversationId, clientId } = uploadImageBody.parse(req.body ?? {});
      const conversation = await conversations.getAuthorized(conversationId, req.auth);

      const mime = detectImageType(req.file.buffer);
      if (!mime) {
        throw new HttpError(415, 'UNSUPPORTED_FILE_TYPE', 'The file is not a valid JPEG, PNG or WEBP image.');
      }

      // A message that was already sent must never have its image replaced.
      if (await messages.findByClientId(conversation.id, clientId)) {
        throw new HttpError(409, 'MESSAGE_ALREADY_SENT', 'This message has already been sent.');
      }

      const path = `${attachmentPathPrefix(conversation.id, req.auth.user.id, clientId)}${IMAGE_TYPES[mime]}`;
      await storage.upload(path, req.file.buffer, mime);
      res.status(201).json({ data: { path, mime, size: req.file.size } });
    },
  };
}
