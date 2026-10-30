import { HttpError } from '../utils/httpError.js';

/**
 * Verifies the Supabase access token (JWT) from the Authorization header and
 * loads the caller's profile. Identity and role are ALWAYS derived from the
 * verified token + database, never from request bodies.
 *
 * Sets req.auth = { user: { id, email }, profile, role }.
 */
export function authenticate({ supabase, profiles }) {
  return async function authenticateRequest(req, _res, next) {
    const header = req.get('authorization') ?? '';
    const match = /^Bearer\s+([A-Za-z0-9._~+/=-]+)$/i.exec(header.trim());
    if (!match) {
      throw new HttpError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');
    }

    const { data, error } = await supabase.auth.getUser(match[1]);
    if (error || !data?.user) {
      const unavailable = error && (error.name === 'AuthRetryableFetchError' || (error.status ?? 0) >= 500);
      if (unavailable) {
        console.error('[auth] Supabase Auth unavailable:', error.message);
        throw new HttpError(503, 'AUTH_UNAVAILABLE', 'The sign-in service is unreachable. Please try again shortly.');
      }
      throw new HttpError(401, 'INVALID_SESSION', 'Your session has expired. Please sign in again.');
    }

    const profile = await profiles.getById(data.user.id);
    if (!profile) {
      throw new HttpError(
        403,
        'PROFILE_MISSING',
        'Your account profile has not been created yet. Ask the administrator to run the database migrations.',
      );
    }

    req.auth = { user: { id: data.user.id, email: data.user.email ?? null }, profile, role: profile.role };
    next();
  };
}
