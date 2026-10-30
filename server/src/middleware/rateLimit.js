import { rateLimit } from 'express-rate-limit';
import { HttpError } from '../utils/httpError.js';

function limiter({ windowMs, limit, message, perUser = false }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Per-user limiters run after authenticate(), so the verified user id is available.
    ...(perUser ? { keyGenerator: (req) => `user:${req.auth.user.id}` } : {}),
    handler: (_req, _res, next) => next(new HttpError(429, 'RATE_LIMITED', message)),
  });
}

export function createRateLimiters() {
  return {
    api: limiter({ windowMs: 15 * 60 * 1000, limit: 900, message: 'Too many requests. Please slow down and try again.' }),
    messages: limiter({ windowMs: 60 * 1000, limit: 40, perUser: true, message: 'You are sending messages too quickly. Please wait a moment.' }),
    uploads: limiter({ windowMs: 60 * 1000, limit: 15, perUser: true, message: 'Too many uploads. Please wait a minute and try again.' }),
    profile: limiter({ windowMs: 15 * 60 * 1000, limit: 30, perUser: true, message: 'Too many profile changes. Please try again later.' }),
  };
}
