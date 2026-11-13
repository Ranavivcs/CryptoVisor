import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../lib/db.js';
import { app, resetDb, signedInAgent, testUser } from '../../test/helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('POST /api/auth/register', () => {
  it('creates the user, sets an httpOnly cookie and never returns the hash', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser).expect(201);

    expect(res.body.user).toMatchObject({ email: testUser.email, name: 'Satoshi', hasPreferences: false });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']?.[0]).toMatch(/token=.+HttpOnly/);
  });

  it('normalises the email so the same address cannot register twice', async () => {
    await request(app).post('/api/auth/register').send(testUser).expect(201);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, email: '  SATOSHI@Example.com ' })
      .expect(409);
    expect(res.body.error).toMatch(/already exists/);
  });

  it('answers 409, not 500, when two signups with the same email race each other', async () => {
    const [a, b] = await Promise.all([
      request(app).post('/api/auth/register').send(testUser),
      request(app).post('/api/auth/register').send(testUser),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
  });

  it('rejects invalid input with field errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', name: '', password: 'short' })
      .expect(400);
    expect(Object.keys(res.body.details)).toEqual(expect.arrayContaining(['email', 'name', 'password']));
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(testUser);
  });

  it('signs in with the right password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);
    expect(res.headers['set-cookie']?.[0]).toMatch(/token=/);
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrong-password' })
      .expect(401);
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever1' })
      .expect(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

describe('session', () => {
  it('GET /me returns the user while signed in, and 401 after logout', async () => {
    const agent = await signedInAgent();
    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user.email).toBe(testUser.email);

    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });

  it('rejects a missing or forged token', async () => {
    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/auth/me').set('Cookie', 'token=forged.jwt.value').expect(401);
  });
});
