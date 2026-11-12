import type { ErrorRequestHandler } from 'express';
import { ZodError, z } from 'zod';
import { HttpError } from '../lib/http-error.js';

/**
 * The one place errors become responses. Every error reply has the shape
 * `{ error: string, details?: Record<field, string[]> }`, so the client handles them uniformly.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Invalid input', details: z.flattenError(err).fieldErrors });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
};
