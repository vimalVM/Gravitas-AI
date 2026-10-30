const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Client-side pre-check (the server re-validates type and size). Returns an error message or null. */
export function validateImageFile(file, maxBytes) {
  if (!file) return 'No file selected.';
  const typeOk = IMAGE_TYPES.includes(file.type) || (!file.type && IMAGE_EXTENSIONS.test(file.name));
  if (!typeOk) return 'Only JPEG, JPG, PNG and WEBP images can be sent.';
  if (file.size === 0) return 'This file is empty.';
  if (file.size > maxBytes) return `Images must be ${formatBytes(maxBytes)} or smaller (this one is ${formatBytes(file.size)}).`;
  return null;
}
