import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/db.js';
import { memesCache } from '../../providers/memes.js';
import { clearNewsCaches } from '../../providers/news.js';
import { pricesCache } from '../../providers/prices.coingecko.js';
import { coinGeckoMarket, fakeExternalApis, rssFeed } from '../../test/fake-apis.js';
import { resetDb, signedInAgent } from '../../test/helpers.js';

const COINGECKO = 'api.coingecko.com';
const CRYPTOPANIC = 'cryptopanic.com';
const OPENROUTER = 'openrouter.ai';
const MEME_API = 'meme-api.com';
const COINTELEGRAPH = 'cointelegraph.com';

const markets = () => [coinGeckoMarket('solana', 'sol', 9.5), coinGeckoMarket('bitcoin', 'btc', -1.2)];

/** A signed-in user who picked Bitcoin and Solana, in that order. */
async function onboardedAgent() {
  const agent = await signedInAgent();
  await agent
    .put('/api/preferences')
    .send({ assets: ['bitcoin', 'solana'], investorType: 'DAY_TRADER', contentTypes: ['CHARTS'] })
    .expect(200);
  return agent;
}

beforeEach(async () => {
  await resetDb();
  pricesCache.clear();
  clearNewsCaches();
  memesCache.clear();
  vi.spyOn(console, 'warn').mockImplementation(() => {}); // fallbacks log a warning by design
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
afterAll(() => prisma.$disconnect());

describe('dashboard sections', () => {
  it('require onboarding first', async () => {
    const agent = await signedInAgent();
    await agent.get('/api/dashboard/prices').expect(409);
  });

  describe('prices', () => {
    it('returns the user’s coins in their order, with their vote, and caches CoinGecko', async () => {
      const api = fakeExternalApis({ [COINGECKO]: () => markets() });
      const agent = await onboardedAgent();
      await agent
        .put('/api/feedback')
        .send({ section: 'PRICES', itemId: 'solana', vote: 1, content: { symbol: 'SOL' } })
        .expect(200);

      const { body } = await agent.get('/api/dashboard/prices').expect(200);
      expect(body.coins.map((c: { id: string }) => c.id)).toEqual(['bitcoin', 'solana']);
      expect(body.coins[0]).toMatchObject({ symbol: 'BTC', change24hPct: -1.2, myVote: 0 });
      expect(body.coins[1].myVote).toBe(1);
      expect(body.coins[0].sparkline).toHaveLength(42);

      await agent.get('/api/dashboard/prices').expect(200);
      expect(api.calls(COINGECKO)).toBe(1);
    });

    it('returns an error (not fake prices) when CoinGecko is down and nothing is cached', async () => {
      fakeExternalApis({
        [COINGECKO]: () => {
          throw new Error('down');
        },
      });
      const agent = await onboardedAgent();
      await agent.get('/api/dashboard/prices').expect(503);
    });
  });

  describe('news', () => {
    it('maps live CryptoPanic posts', async () => {
      fakeExternalApis({
        [CRYPTOPANIC]: (url) => {
          expect(url.searchParams.get('currencies')).toBe('BTC,SOL');
          return {
            results: [
              { id: 7, title: 'SOL hits a new high', published_at: '2026-11-13T08:00:00Z', source: { title: 'CoinDesk' }, instruments: [{ code: 'SOL' }] },
            ],
          };
        },
      });
      const agent = await onboardedAgent();
      const { body } = await agent.get('/api/dashboard/news').expect(200);
      expect(body.source).toBe('live');
      expect(body.items[0]).toMatchObject({ id: 'cp-7', title: 'SOL hits a new high', sourceName: 'CoinDesk', coins: ['SOL'], myVote: 0 });
    });

    it('uses the free RSS feed when CryptoPanic fails, with the user’s coins first', async () => {
      fakeExternalApis({
        [CRYPTOPANIC]: () => {
          throw new Error('paid plan required');
        },
        [COINTELEGRAPH]: () =>
          rssFeed(['ETF outflows hit $2B', 'Solana DEX volume doubles', 'Bitcoin miners sell & hedge', 'Solar-powered mining?']),
      });
      const agent = await onboardedAgent();
      const { body } = await agent.get('/api/dashboard/news').expect(200);

      expect(body.source).toBe('live');
      expect(body.items.map((item: { title: string; coins: string[] }) => [item.title, item.coins])).toEqual([
        ['Solana DEX volume doubles', ['SOL']],
        ['Bitcoin miners sell & hedge', ['BTC']],
        ['ETF outflows hit $2B', []],
        ['Solar-powered mining?', []], // "Solar" is not Solana
      ]);
      expect(body.items[1]).toMatchObject({ url: 'https://news.example/2', sourceName: 'Cointelegraph' });
    });

    it('falls back to static news about the user’s coins when every live source fails', async () => {
      fakeExternalApis({
        [CRYPTOPANIC]: () => {
          throw new Error('paid plan required');
        },
        [COINTELEGRAPH]: () => {
          throw new Error('feed down');
        },
      });
      const agent = await onboardedAgent();
      const { body } = await agent.get('/api/dashboard/news').expect(200);
      expect(body.source).toBe('fallback');
      const coinTagged = body.items.filter((item: { coins: string[] }) => item.coins.length > 0);
      expect(coinTagged.length).toBeGreaterThan(0);
      for (const item of coinTagged) expect(['BTC', 'SOL']).toContain(item.coins[0]);
    });
  });

  describe('insight', () => {
    it('generates once per day with the LLM and stores the prompt and model', async () => {
      const api = fakeExternalApis({
        [COINGECKO]: () => markets(),
        [OPENROUTER]: (_url, init) => {
          const body = JSON.parse(String(init?.body));
          expect(body.messages[1].content).toContain('Investor type: Day Trader.');
          expect(body.reasoning).toEqual({ enabled: false });
          expect(body.messages[1].content).toContain('SOL $100 (+9.5% 24h)');
          return { model: 'google/gemma-test:free', choices: [{ message: { content: 'SOL is leading today.' } }] };
        },
      });
      const agent = await onboardedAgent();

      const first = await agent.get('/api/dashboard/insight').expect(200);
      expect(first.body).toMatchObject({ source: 'live', insight: { text: 'SOL is leading today.', model: 'google/gemma-test:free', myVote: 0 } });

      const second = await agent.get('/api/dashboard/insight').expect(200);
      expect(second.body.insight.id).toBe(first.body.insight.id);
      expect(api.calls(OPENROUTER)).toBe(1);

      const stored = await prisma.dailyInsight.findFirstOrThrow();
      expect(stored.prompt).toContain('Day Trader');
    });

    it('uses a personalised fallback when the LLM fails, and does not store it', async () => {
      fakeExternalApis({
        [COINGECKO]: () => markets(),
        [OPENROUTER]: () => {
          throw new Error('rate limited');
        },
      });
      const agent = await onboardedAgent();
      const { body } = await agent.get('/api/dashboard/insight').expect(200);
      expect(body.source).toBe('fallback');
      expect(body.insight.text).toContain('Solana is the biggest mover');
      expect(body.insight.text).toContain('Day Trader');
      expect(await prisma.dailyInsight.count()).toBe(0);
    });
  });

  describe('meme', () => {
    const post = (id: string, extra = {}) => ({
      postLink: `https://redd.it/${id}`,
      title: `meme ${id}`,
      url: `https://i.redd.it/${id}.png`,
      nsfw: false,
      spoiler: false,
      ...extra,
    });

    it('never serves NSFW posts or memes the user voted down', async () => {
      fakeExternalApis({
        [MEME_API]: () => ({ memes: [post('good'), post('bad'), post('nsfw', { nsfw: true }), post('video', { url: 'https://v.redd.it/x' })] }),
      });
      const agent = await onboardedAgent();
      await agent
        .put('/api/feedback')
        .send({ section: 'MEME', itemId: 'reddit-bad', vote: -1, content: { title: 'meme bad' } })
        .expect(200);

      for (let i = 0; i < 10; i++) {
        const { body } = await agent.get('/api/dashboard/meme').expect(200);
        expect(body.meme.id).toBe('reddit-good');
      }
    });

    it('falls back to the built-in text memes when the feed is down', async () => {
      fakeExternalApis({
        [MEME_API]: () => {
          throw new Error('down');
        },
      });
      const agent = await onboardedAgent();
      const { body } = await agent.get('/api/dashboard/meme').expect(200);
      expect(body.source).toBe('fallback');
      expect(body.meme.text).toBeTruthy();
    });
  });
});
