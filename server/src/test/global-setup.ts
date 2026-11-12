import { execSync } from 'node:child_process';

/** Runs once before all tests: brings the test database schema up to date. */
export default function setup() {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ?? 'postgresql://moveo:moveo@localhost:5433/moveo_test',
    },
  });
}
