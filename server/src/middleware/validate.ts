import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

/**
 * Validates `req.body` against a zod schema and replaces it with the parsed value
 * (trimmed, lower-cased where the schema says so, unknown keys stripped).
 * A failure throws a ZodError, which the error handler turns into a 400.
 */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}
