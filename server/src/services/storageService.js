import { storageError } from '../utils/httpError.js';

/** Private Supabase Storage access. Browsers only ever get short-lived signed URLs. */
export function createStorageService({ supabase, env }) {
  const bucket = () => supabase.storage.from(env.storageBucket);

  return {
    async upload(path, buffer, contentType) {
      const { error } = await bucket().upload(path, buffer, { contentType, upsert: true, cacheControl: '3600' });
      if (error) throw storageError(error, 'upload');
    },

    /** Returns the stored object's metadata, or null when it does not exist. */
    async find(path) {
      const index = path.lastIndexOf('/');
      const folder = path.slice(0, index);
      const name = path.slice(index + 1);
      const { data, error } = await bucket().list(folder, { search: name, limit: 10 });
      if (error) throw storageError(error, 'lookup');
      return data?.find((item) => item.name === name) ?? null;
    },

    async remove(paths) {
      const list = paths.filter(Boolean);
      if (!list.length) return;
      const { error } = await bucket().remove(list);
      if (error) console.warn('[storage] cleanup failed:', error.message);
    },

    /** Signs many paths at once. Returns Map(path -> { url, expiresAt }). Missing objects are skipped. */
    async signMany(paths) {
      const unique = [...new Set(paths.filter(Boolean))];
      const result = new Map();
      if (!unique.length) return result;
      const { data, error } = await bucket().createSignedUrls(unique, env.signedUrlTtlSeconds);
      if (error) {
        console.warn('[storage] signing failed:', error.message);
        return result;
      }
      const expiresAt = new Date(Date.now() + env.signedUrlTtlSeconds * 1000).toISOString();
      for (const item of data ?? []) {
        if (item.signedUrl && !item.error) result.set(item.path, { url: item.signedUrl, expiresAt });
      }
      return result;
    },

    async signOne(path) {
      if (!path) return null;
      const map = await this.signMany([path]);
      return map.get(path) ?? null;
    },
  };
}
