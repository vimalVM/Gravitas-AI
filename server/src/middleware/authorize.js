import { HttpError } from '../utils/httpError.js';

/** Allows the request only when the authenticated profile has one of the roles. */
export function requireRole(...roles) {
  return function authorizeRole(req, _res, next) {
    if (!req.auth) {
      throw new HttpError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');
    }
    if (!roles.includes(req.auth.role)) {
      throw new HttpError(403, 'FORBIDDEN', 'Your account is not allowed to perform this action.');
    }
    next();
  };
}
