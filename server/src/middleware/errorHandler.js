import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';

export function notFoundHandler(req, _res, next) {
  next(new HttpError(404, 'ROUTE_NOT_FOUND', `No API route matches ${req.method} ${req.path}.`));
}

/** Centralised error handler: consistent JSON, no stack traces for clients. */
export function errorHandler(env) {
  // Express recognises error handlers by their four parameters, so _next must stay.
  return function handleError(err, req, res, _next) {
    let status = 500;
    let body = { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side. Please try again.' };

    if (err instanceof HttpError) {
      status = err.status;
      body = { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) };
    } else if (err instanceof ZodError) {
      status = 400;
      body = {
        code: 'VALIDATION_ERROR',
        message: err.issues[0]?.message ?? 'The request is invalid.',
        details: err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      };
    } else if (err?.type === 'entity.parse.failed') {
      status = 400;
      body = { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' };
    } else if (err?.type === 'entity.too.large') {
      status = 413;
      body = { code: 'PAYLOAD_TOO_LARGE', message: 'The request is too large.' };
    }

    if (status >= 500) {
      console.error(`[error] ${req.method} ${req.originalUrl}:`, env.isProduction ? err?.message : err);
    }
    res.status(status).json({ error: body });
  };
}
