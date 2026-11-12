import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../lib/db.js';

export const app = createApp();

/** Empties every table. Call in beforeEach so tests don't depend on each other. */
export async function resetDb() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Feedback", "DailyInsight", "Preferences", "User" RESTART IDENTITY CASCADE',
  );
}

export const testUser = { email: 'satoshi@example.com', name: 'Satoshi', password: 'hunter2hunter2' };

/** Registers the test user and returns a supertest agent that keeps the session cookie. */
export async function signedInAgent() {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send(testUser).expect(201);
  return agent;
}
