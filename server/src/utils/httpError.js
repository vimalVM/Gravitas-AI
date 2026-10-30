/** An error that is safe to show to API clients. */
export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (message = 'The requested resource was not found.') => new HttpError(404, 'NOT_FOUND', message);

/**
 * Converts a Supabase/PostgREST error into a safe HttpError. The original
 * error is logged on the server only.
 */
export function dbError(error, context = 'database operation') {
  console.error(`[db] ${context} failed:`, error?.code, error?.message);
  const missingSchema = ['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error?.code);
  if (missingSchema) {
    return new HttpError(
      500,
      'DATABASE_NOT_READY',
      'The database schema is missing or outdated. Run the SQL migrations in supabase/migrations (see README).',
    );
  }
  if (error?.message?.includes('fetch failed')) {
    return new HttpError(503, 'DATABASE_UNAVAILABLE', 'The database is unreachable right now. Please try again shortly.');
  }
  return new HttpError(500, 'DATABASE_ERROR', 'A database error occurred. Please try again.');
}

export function storageError(error, context = 'storage operation') {
  console.error(`[storage] ${context} failed:`, error?.message);
  if (/bucket not found/i.test(error?.message ?? '')) {
    return new HttpError(
      500,
      'STORAGE_NOT_CONFIGURED',
      'Image storage is not configured. Run the storage migration (see README).',
    );
  }
  return new HttpError(502, 'STORAGE_ERROR', 'The image could not be stored or retrieved. Please try again.');
}
