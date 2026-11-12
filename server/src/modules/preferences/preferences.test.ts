import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../lib/db.js';
import { app, resetDb, signedInAgent } from '../../test/helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const validAnswers = {
  assets: ['bitcoin', 'ethereum'],
  investorType: 'HODLER',
  contentTypes: ['MARKET_NEWS', 'FUN'],
};

describe('/api/preferences', () => {
  it('requires a session', async () => {
    await request(app).get('/api/preferences/options').expect(401);
    await request(app).put('/api/preferences').send(validAnswers).expect(401);
  });

  it('serves the quiz options with a label for every choice', async () => {
    const agent = await signedInAgent();
    const { body } = await agent.get('/api/preferences/options').expect(200);

    expect(body.coins).toContainEqual({ id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' });
    expect(body.investorTypes.map((c: { value: string }) => c.value)).toContain('DAY_TRADER');
    for (const choice of [...body.investorTypes, ...body.contentTypes]) {
      expect(choice.label).toBeTruthy();
    }
  });

  it('is null before onboarding; saving completes onboarding', async () => {
    const agent = await signedInAgent();
    expect((await agent.get('/api/preferences').expect(200)).body.preferences).toBeNull();

    const saved = await agent.put('/api/preferences').send(validAnswers).expect(200);
    expect(saved.body.preferences).toMatchObject(validAnswers);

    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user.hasPreferences).toBe(true);
  });

  it('overwrites on a second save and drops duplicate answers', async () => {
    const agent = await signedInAgent();
    await agent.put('/api/preferences').send(validAnswers).expect(200);
    await agent
      .put('/api/preferences')
      .send({ assets: ['solana', 'solana'], investorType: 'DAY_TRADER', contentTypes: ['CHARTS'] })
      .expect(200);

    const { body } = await agent.get('/api/preferences').expect(200);
    expect(body.preferences).toMatchObject({ assets: ['solana'], investorType: 'DAY_TRADER', contentTypes: ['CHARTS'] });
    expect(await prisma.preferences.count()).toBe(1);
  });

  it('rejects unknown coins, empty lists and unknown investor types', async () => {
    const agent = await signedInAgent();
    const { body } = await agent
      .put('/api/preferences')
      .send({ assets: ['not-a-coin'], investorType: 'WHALE', contentTypes: [] })
      .expect(400);
    expect(Object.keys(body.details)).toEqual(expect.arrayContaining(['assets', 'investorType', 'contentTypes']));
  });
});
