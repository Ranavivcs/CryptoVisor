import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

/**
 * All environment variables the server reads, validated once at startup.
 * Every other module imports `env` from here instead of touching `process.env`,
 * so a missing or malformed variable fails fast with a clear message.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  // External APIs. All optional: without a key, that section uses its fallback.
  COINGECKO_API_KEY: z.string().optional(),
  CRYPTOPANIC_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  /** Free models change often, so the model list is config, not code. Comma-separated, tried in order. */
  OPENROUTER_MODELS: z
    .string()
    .default('nvidia/nemotron-3.5-lightning:free,nvidia/nemotron-3.5-super-vl:free,google/gemma-4-31b-it:free')
    .transform((value) => value.split(',').map((model) => model.trim()).filter(Boolean)),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
