import { defineConfig } from 'vitest/config';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://moveo:moveo@localhost:5433/moveo_test';

export default defineConfig({
  test: {
    environment: 'node',
    // Tests share one real Postgres database, so run files one after another.
    fileParallelism: false,
    globalSetup: './src/test/global-setup.ts',
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
    },
  },
});
