import { useCallback, useEffect, useState } from 'react';
import { fetchAttachmentUrl } from '../services/chatApi';

// messageId -> signed URL, so re-rendering or reopening a chat does not re-sign.
const urlCache = new Map();

export function clearSignedImageCache() {
  urlCache.clear();
}

/**
 * Resolves the URL to display for an image message: the signed URL from the
 * API, a local preview while uploading, or a freshly signed URL for images
 * delivered via Realtime. Retries signing once if the URL has expired.
 */
export function useSignedImage(message) {
  const { id, attachmentUrl, localPreviewUrl, attachmentPath } = message;
  const [fetched, setFetched] = useState(() => (id ? urlCache.get(id) ?? null : null));
  const [failed, setFailed] = useState(false);
  const [retried, setRetried] = useState(false);

  const resolve = useCallback(async () => {
    if (!id) return;
    try {
      const { url } = await fetchAttachmentUrl(id);
      urlCache.set(id, url);
      setFetched(url);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [id]);

  useEffect(() => {
    if (attachmentUrl && id) urlCache.set(id, attachmentUrl);
  }, [attachmentUrl, id]);

  const needsFetch = Boolean(id && attachmentPath && !attachmentUrl && !localPreviewUrl && !fetched);
  useEffect(() => {
    if (needsFetch) resolve();
  }, [needsFetch, resolve]);

  const src = fetched ?? attachmentUrl ?? localPreviewUrl ?? null;

  const onError = useCallback(() => {
    if (!id || retried) {
      setFailed(true);
      return;
    }
    setRetried(true);
    urlCache.delete(id);
    resolve();
  }, [id, retried, resolve]);

  return { src, failed, onError };
}
