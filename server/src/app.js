import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServices } from './services/index.js';
import { authenticate } from './middleware/authenticate.js';
import { createRateLimiters } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { HttpError } from './utils/httpError.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { conversationsRouter } from './routes/conversations.js';
import { messagesRouter } from './routes/messages.js';
import { uploadsRouter } from './routes/uploads.js';

/**
 * Builds the Express application. Dependencies are injected so tests can use
 * a fake Supabase client.
 */
export function createApp({ env, supabase }) {
  const app = express();
  const services = createServices({ supabase, env });
  const limiters = createRateLimiters();
  const authenticateRequest = authenticate({ supabase, profiles: services.profiles });
  const deps = { env, supabase, services, limiters, authenticateRequest };

  app.disable('x-powered-by');
  if (env.trustProxy) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Requests without an Origin header (curl, same-origin proxies) are allowed;
        // they still need a valid access token for protected routes.
        if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
        return callback(new HttpError(403, 'CORS_FORBIDDEN', 'This origin is not allowed to use the API.'));
      },
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '32kb' }));

  const api = express.Router();
  api.use(limiters.api);
  api.use('/health', healthRouter(deps));
  api.use('/auth', authRouter(deps));
  api.use('/conversations', conversationsRouter(deps));
  api.use('/messages', messagesRouter(deps));
  api.use('/uploads', uploadsRouter(deps));

  app.use('/api', api);
  app.use(notFoundHandler);
  app.use(errorHandler(env));

  return app;
}
