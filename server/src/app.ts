import cookieParser from 'cookie-parser';
import express from 'express';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';

/**
 * Builds the Express app without starting it, so tests can drive it with supertest.
 * Order matters: parsers, then routes, then the 404 fallback, then the error handler last.
 */
export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // behind Render's proxy: lets Express see the request as HTTPS
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api/auth', authRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(errorHandler);
  return app;
}
