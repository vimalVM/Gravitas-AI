import { randomUUID } from 'node:crypto';
import { HttpError } from '../utils/httpError.js';
import { IMAGE_TYPES, detectImageType } from '../utils/fileValidation.js';
import { updateProfileBody } from '../validators/schemas.js';

export function createAuthController({ profiles, storage }) {
  return {
    async getMe(req, res) {
      res.json({ data: { profile: await profiles.toApi(req.auth.profile, req.auth.user.email) } });
    },

    getRole(req, res) {
      res.json({ data: { role: req.auth.role } });
    },

    async updateMe(req, res) {
      const { displayName } = updateProfileBody.parse(req.body);
      const updated = await profiles.updateDisplayName(req.auth.user.id, displayName);
      res.json({ data: { profile: await profiles.toApi(updated, req.auth.user.email) } });
    },

    async uploadAvatar(req, res) {
      if (!req.file) throw new HttpError(400, 'FILE_REQUIRED', 'Choose an image to upload.');
      const mime = detectImageType(req.file.buffer);
      if (!mime) throw new HttpError(415, 'UNSUPPORTED_FILE_TYPE', 'The file is not a valid JPEG, PNG or WEBP image.');

      const previous = req.auth.profile.avatar_path;
      const path = `avatars/${req.auth.user.id}/${randomUUID()}.${IMAGE_TYPES[mime]}`;
      await storage.upload(path, req.file.buffer, mime);
      const updated = await profiles.setAvatarPath(req.auth.user.id, path);
      if (previous && previous !== path) await storage.remove([previous]);

      res.json({ data: { profile: await profiles.toApi(updated, req.auth.user.email) } });
    },
  };
}
