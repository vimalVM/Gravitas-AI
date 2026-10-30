import { useCallback, useEffect, useState } from 'react';
import { validateImageFile } from '../utils/files';

/** Holds one selected image with a local preview URL (revoked automatically). */
export function useImageAttachment(maxBytes) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const select = useCallback(
    (nextFile) => {
      const problem = validateImageFile(nextFile, maxBytes);
      if (problem) {
        setError(problem);
        return false;
      }
      setError(null);
      setFile(nextFile);
      setPreviewUrl(URL.createObjectURL(nextFile));
      return true;
    },
    [maxBytes],
  );

  const clear = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return { file, previewUrl, error, select, clear, dismissError };
}
