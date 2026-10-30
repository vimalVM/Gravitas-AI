/** Allowed image MIME types mapped to the file extension used in storage. */
export const IMAGE_TYPES = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
});

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function normalizeMime(mime) {
  const value = String(mime ?? '').toLowerCase().trim();
  return value === 'image/jpg' || value === 'image/pjpeg' ? 'image/jpeg' : value;
}

/**
 * Detects the real image type from the file's magic bytes, so a renamed
 * executable or HTML file cannot be uploaded as "image/png".
 */
export function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return 'image/png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}
