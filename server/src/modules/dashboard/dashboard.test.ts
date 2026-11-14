import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/db.js';
import { memesCache } from '../../providers/memes.js';
import { clearNewsCaches } from '../../providers/news.js';
import { pricesCache } from '../../providers/prices.coingecko.js';
import { coinGeckoMarket, fakeExternalApis, rssFeed } from '../../test/fake-apis.js';
import { resetDb, signedInAgent } from '../../test/helpers.js';
import { isTimeZone, todayIn } from '../../lib/dates.js';

const COINGECKO = 'api.coingecko.com';
const CRYPTOPANIC = 'cryptopanic.com';
const OPENROUTER = 'openrouter.ai';
const MEME_API = 'meme-api.com';
const COINTELEGRAPH = 'cointelegraph.com';
const COINDESK = 'www.coindesk.com';
const DECRYPT = 'decrypt.co';

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
      expect(body.coins[0]).toMatchObject({ symbol: 'BTC', change24hPct: -1.2, lastUpdated: '2026-11-12T10:30:00.000Z', myVote: 0 });
      expect(body.coins[1].myVote).toBe(1);
      expect(body.coins[0].sparkline).toHaveLength(42);

      await agent.get('/api/dashboard/prices').expect(200);
      expect(api.calls(COINGECKO)).toBe(1);
    });

    it('adds the 3 biggest 24h movers the user does not follow, up or down', async () => {
      fakeExternalApis({
        [COINGECKO]: (url) => {
          expect(url.searchParams.get('order')).toBe('market_cap_desc');
          return [
            ...markets(), // bitcoin and solana: followed, so never "movers"
            coinGeckoMarket('ethereum', 'eth', 1.0),
            coinGeckoMarket('pepe', 'pepe', -18.0),
            coinGeckoMarket('sui', 'sui', 12.5),
            coinGeckoMarket('tether', 'usdt', 0.0),
            coinGeckoMarket('aave', 'aave', 4.2),
          ];
        },
      });
      const agent = await onboardedAgent();
      const { body } = await agent.get('/api/dashboard/prices').expect(200);
      expect(body.movers.map((c: { id: string }) => c.id)).toEqual(['pepe', 'sui', 'aave']);
      expect(body.movers[0]).toMatchObject({ change24hPct: -18, myVote: 0 });
    });

    it('fetches a followed coin by id if it has dropped out of the top 100', async () => {
      const api = fakeExternalApis({
        [COINGECKO]: (url) => (url.searchParams.get('ids') === 'solana' ? [coinGeckoMarket('solana', 'sol', 2)] : [coinGeckoMarket('bitcoin', 'btc', 1)]),
      });
      const agent = await onboardedAgent();
      const { body } = await agent.get('/api/dashboard/prices').expect(200);
      expect(body.coins.map((c: { id: string }) => c.id)).toEqual(['bitcoin', 'solana']);
      expect(api.calls(COINGECKO)).toBe(2);
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

    it('merges the feeds newest first, takes only coin stories from mixed feeds, and hides downvoted ones', async () => {
      fakeExternalApis({
        [CRYPTOPANIC]: () => {
          throw new Error('paid plan required');
        },
        [COINTELEGRAPH]: () => rssFeed(['Bitcoin ETF flows', 'Stablecoin rules'], { base: 'https://ct.example', offsetHours: 2 }),
        [COINDESK]: () => rssFeed(['Bitcoin hits $80K'], { base: 'https://cd.example' }),
        [DECRYPT]: () => rssFeed(['Nvidia earnings beat', 'Solana phone ships'], { base: 'https://dc.example' }),
      });
      const agent = await onboardedAgent();
      const titles = async () =>
        (await agent.get('/api/dashboard/news').expect(200)).body.items.map((item: { title: string }) => item.title);

      // Coin stories by age (0h, 1h, 2h), then general news from crypto-only feeds. No Nvidia.
      expect(await titles()).toEqual(['Bitcoin hits $80K', 'Solana phone ships', 'Bitcoin ETF flows', 'Stablecoin rules']);

      await agent.put('/api/feedback').send({ section: 'NEWS', itemId: 'rss-https://cd.example/0', vote: -1, content: {} }).expect(200);
      expect(await titles()).toEqual(['Solana phone ships', 'Bitcoin ETF flows', 'Stablecoin rules']);
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
          expect(body.messages[1].content).toContain('Investor type: Day Trader (cares about');
          expect(body.reasoning).toEqual({ enabled: false });
          expect(body.messages[1].content).toContain('SOL $100 (+9.5% 24h, +0.0% 7d)');
          // Unfaked news feeds fail here, so the prompt has no headlines (and sample news isn't used instead).
          expect(body.messages[1].content).not.toContain('headlines');
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

    it("gives the LLM the investor's focus and today's headlines about their coins only", async () => {
      let prompt = '';
      fakeExternalApis({
        [COINGECKO]: () => markets(),
        [COINTELEGRAPH]: () => rssFeed(['Solana DEX volume doubles', 'Stablecoin rules', 'Bitcoin ETF flows']),
        [OPENROUTER]: (_url, init) => {
          prompt = JSON.parse(String(init?.body)).messages[1].content;
          return { model: 'm:free', choices: [{ message: { content: 'Takeaway.\nSOL: watch volume.' } }] };
        },
      });
      const agent = await onboardedAgent();
      const { body } = await agent.get('/api/dashboard/insight').expect(200);
      expect(body.insight.text).toBe('Takeaway.\nSOL: watch volume.');
      // SOL is up 9.5% in the fake prices: the rule-based verdict calls it out.
      expect(body.verdict).toMatchObject({ level: 'big', title: 'Big move' });
      expect(body.verdict.advice).toContain('SOL is up 9.5% today');
      expect(prompt).toContain('Day Trader (cares about: short-term moves, charts and momentum)');
      expect(prompt).toContain("Today's headlines about their coins:\n- Solana DEX volume doubles\n- Bitcoin ETF flows");
      expect(prompt).not.toContain('Stablecoin rules'); // general news, not about their coins
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
      expect(body.insight.text).toContain('As a day trader, moves like this');
      expect(await prisma.dailyInsight.count()).toBe(0);
    });

    it("keys the day on the user's time zone, so the insight switches at their midnight", () => {
      // 23:30 UTC on Nov 12 is already 01:30 on Nov 13 in Israel (UTC+2).
      const lateEvening = new Date('2026-11-12T23:30:00Z');
      expect(todayIn('UTC', lateEvening).toISOString()).toBe('2026-11-12T00:00:00.000Z');
      expect(todayIn('Asia/Jerusalem', lateEvening).toISOString()).toBe('2026-11-13T00:00:00.000Z');
      expect(todayIn('America/New_York', lateEvening).toISOString()).toBe('2026-11-12T00:00:00.000Z');
    });

    it('ignores an unknown time zone and uses UTC', async () => {
      expect(isTimeZone('Asia/Jerusalem')).toBe(true);
      expect(isTimeZone('Mars/Olympus')).toBe(false);
      expect(isTimeZone(['UTC'])).toBe(false);

      fakeExternalApis({
        [COINGECKO]: () => markets(),
        [OPENROUTER]: () => ({ model: 'm:free', choices: [{ message: { content: 'Hi.' } }] }),
      });
      const agent = await onboardedAgent();
      await agent.get('/api/dashboard/insight?tz=Mars/Olympus').expect(200);
      const stored = await prisma.dailyInsight.findFirstOrThrow();
      expect(stored.day.toISOString()).toBe(todayIn('UTC').toISOString());
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
