import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../lib/db.js';
import { resetDb, signedInAgent } from '../../test/helpers.js';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const newsVote = { section: 'NEWS', itemId: 'cp-7', content: { title: 'SOL hits a new high', sourceName: 'CoinDesk' } };

async function onboardedAgent() {
  const agent = await signedInAgent();
  await agent
    .put('/api/preferences')
    .send({ assets: ['solana'], investorType: 'HODLER', contentTypes: ['MARKET_NEWS'] })
    .expect(200);
  return agent;
}

describe('/api/feedback', () => {
  it('stores the vote with what the user saw and their preferences at that moment', async () => {
    const agent = await onboardedAgent();
    await agent.put('/api/feedback').send({ ...newsVote, vote: 1 }).expect(200);

    const row = await prisma.feedback.findFirstOrThrow();
    expect(row).toMatchObject({ section: 'NEWS', itemId: 'cp-7', vote: 1 });
    expect(row.contentSnapshot).toMatchObject({
      item: newsVote.content,
      preferences: { assets: ['solana'], investorType: 'HODLER', contentTypes: ['MARKET_NEWS'] },
    });
  });

  it('changes the vote on a second click and removes it on DELETE', async () => {
    const agent = await onboardedAgent();
    await agent.put('/api/feedback').send({ ...newsVote, vote: 1 }).expect(200);
    await agent.put('/api/feedback').send({ ...newsVote, vote: -1 }).expect(200);
    expect(await prisma.feedback.findMany({ select: { vote: true } })).toEqual([{ vote: -1 }]);

    await agent.delete('/api/feedback/NEWS/cp-7').expect(204);
    expect(await prisma.feedback.count()).toBe(0);
  });

  it('rejects votes other than 1 and -1, and unknown sections', async () => {
    const agent = await onboardedAgent();
    await agent.put('/api/feedback').send({ ...newsVote, vote: 5 }).expect(400);
    await agent.put('/api/feedback').send({ ...newsVote, section: 'WEATHER', vote: 1 }).expect(400);
    await agent.delete('/api/feedback/WEATHER/x').expect(400);
  });

  it('requires onboarding, because the snapshot needs preferences', async () => {
    const agent = await signedInAgent();
    await agent.put('/api/feedback').send({ ...newsVote, vote: 1 }).expect(409);
  });
});
