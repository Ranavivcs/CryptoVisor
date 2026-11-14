import type { Section } from '../../generated/prisma/enums.js';
import { dayKey, todayIn } from '../../lib/dates.js';
import { prisma } from '../../lib/db.js';
import { HttpError } from '../../lib/http-error.js';
import { generateInsight, type InsightContext } from '../../providers/insight.openrouter.js';
import { getMeme } from '../../providers/memes.js';
import { getNews } from '../../providers/news.js';
import { getCoinMarkets, getTopMovers, type CoinMarket } from '../../providers/prices.coingecko.js';
import type { DataSource } from '../../providers/types.js';
import { getDownvotedIds, getMyVotes, type MyVote } from '../feedback/feedback.service.js';
import { coinsFor, contentTypeLabel, investorTypeFocus, investorTypeLabel, investorTypeTipFor, symbolsFor } from '../preferences/preferences.catalog.js';
import { requirePreferences, type Preferences } from '../preferences/preferences.service.js';
import { verdictFor } from './verdict.js';

/**
 * The four dashboard sections, one function each, called by dashboard.routes.ts.
 * Each one: checks the user finished onboarding, asks a provider (src/providers) for content,
 * and attaches the user's votes. Providers know nothing about users or votes; this layer
 * is where external content meets our database.
 */

/** Each dashboard item carries the user's current vote, so the thumbs render in the right state. */
type WithVote<T> = T & { myVote: MyVote };

/** Adds `myVote` to each item, with one DB query for the whole list. Used by every section below. */
async function withVotes<T extends { id: string }>(userId: string, section: Section, items: T[]): Promise<WithVote<T>[]> {
  const votes = await getMyVotes(userId, section, items.map((item) => item.id));
  return items.map((item) => ({ ...item, myVote: votes.get(item.id) ?? 0 }));
}

const TOP_MOVERS = 3;

/**
 * GET /api/dashboard/prices: the user's coins, plus the biggest 24h movers among the top 100
 * they don't follow. Throws 503 (→ error card) if CoinGecko is down and nothing is cached.
 */
export async function getPricesSection(userId: string) {
  const { assets } = await requirePreferences(userId);
  const [mine, movers] = await Promise.all([getCoinMarkets(assets), getTopMovers(new Set(assets), TOP_MOVERS)]).catch((err: Error) => {
    console.warn('Prices: CoinGecko failed and nothing is cached.', err.message);
    throw new HttpError(503, 'Live prices are unavailable right now. Try again in a minute.');
  });
  // One vote query for both lists.
  const voted = await withVotes(userId, 'PRICES', [...mine, ...movers]);
  return { source: 'live' as DataSource, coins: voted.slice(0, mine.length), movers: voted.slice(mine.length) };
}

/** GET /api/dashboard/news: news about the user's coins (live or fallback), without stories they voted down. */
export async function getNewsSection(userId: string) {
  const { assets } = await requirePreferences(userId);
  const news = await getNews(coinsFor(assets), await getDownvotedIds(userId, 'NEWS'));
  return { source: news.source, items: await withVotes(userId, 'NEWS', news.data) };
}

const INSIGHT_HEADLINES = 3;

/**
 * Up to three of today's live headlines about the user's coins, for the insight prompt. General
 * stories and the built-in sample news are left out, so the model only sees real news about these coins.
 * Never throws: the insight must not fail because news did. Used by `getInsightSection`.
 */
async function headlinesFor(assets: string[]): Promise<string[]> {
  try {
    const news = await getNews(coinsFor(assets));
    if (news.source === 'fallback') return [];
    return news.data.filter((item) => item.coins.length > 0).slice(0, INSIGHT_HEADLINES).map((item) => item.title);
  } catch {
    return [];
  }
}

/** Preferences + today's prices and headlines → what the LLM (or the rule-based fallback) needs. Used by `getInsightSection`. */
function insightContextFor(preferences: Preferences, markets: CoinMarket[], headlines: string[]): InsightContext {
  return {
    investorType: investorTypeLabel(preferences.investorType),
    investorFocus: investorTypeFocus(preferences.investorType),
    investorTip: investorTypeTipFor(preferences.investorType),
    interests: preferences.contentTypes.map(contentTypeLabel),
    markets,
    symbols: symbolsFor(preferences.assets),
    headlines,
  };
}

/**
 * The response shape for one insight, with the user's vote and today's rule-based verdict
 * (worked out from current prices on each load, not stored). Used for all three paths of `getInsightSection`.
 */
async function insightResponse(
  userId: string,
  source: DataSource,
  insight: { id: string; text: string; model: string },
  markets: CoinMarket[],
) {
  const [withVote] = await withVotes(userId, 'INSIGHT', [{ id: insight.id, text: insight.text, model: insight.model }]);
  return { source, insight: withVote, verdict: verdictFor(markets) };
}

/**
 * GET /api/dashboard/insight: the AI insight of the day. Generated once per user per day (in their
 * time zone, see lib/dates.ts) and stored with its prompt and model, so later reloads are instant and
 * free. A fallback insight is never stored, so the next load tries the LLM again.
 */
export async function getInsightSection(userId: string, timeZone = 'UTC') {
  const preferences = await requirePreferences(userId);
  const day = todayIn(timeZone);

  // Prices are needed on every path, for the verdict (served from the shared one-minute cache).
  const markets = await getCoinMarkets(preferences.assets).catch(() => []);
  const stored = await prisma.dailyInsight.findUnique({ where: { userId_day: { userId, day } } });
  if (stored) return insightResponse(userId, 'live', stored, markets);

  const generated = await generateInsight(insightContextFor(preferences, markets, await headlinesFor(preferences.assets)));
  if (generated.source === 'fallback') {
    return insightResponse(userId, 'fallback', { id: `fallback-${dayKey(day)}`, ...generated.data }, markets);
  }

  // upsert, not create: two tabs loading at once must not fail on the unique (userId, day) key.
  const saved = await prisma.dailyInsight.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, ...generated.data },
    update: {},
  });
  return insightResponse(userId, 'live', saved, markets);
}

/** GET /api/dashboard/meme: a random meme, skipping ones the user voted down. */
export async function getMemeSection(userId: string) {
  await requirePreferences(userId);
  const meme = await getMeme(await getDownvotedIds(userId, 'MEME'));
  const [withVote] = await withVotes(userId, 'MEME', [meme.data]);
  return { source: meme.source, meme: withVote };
}
