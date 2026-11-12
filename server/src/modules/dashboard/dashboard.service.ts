import type { Section } from '../../generated/prisma/enums.js';
import { prisma } from '../../lib/db.js';
import { HttpError } from '../../lib/http-error.js';
import { generateInsight } from '../../providers/insight.openrouter.js';
import { getMeme } from '../../providers/memes.js';
import { getNews } from '../../providers/news.js';
import { getCoinMarkets, type CoinMarket } from '../../providers/prices.coingecko.js';
import type { DataSource } from '../../providers/types.js';
import { getDownvotedIds, getMyVotes, type MyVote } from '../feedback/feedback.service.js';
import { coinsFor, contentTypeLabel, investorTypeLabel, symbolsFor } from '../preferences/preferences.catalog.js';
import { getPreferences, type Preferences } from '../preferences/preferences.service.js';

/** Each dashboard item carries the user's current vote, so the thumbs render in the right state. */
type WithVote<T> = T & { myVote: MyVote };

async function requirePreferences(userId: string): Promise<Preferences> {
  const preferences = await getPreferences(userId);
  if (!preferences) throw new HttpError(409, 'Finish onboarding first');
  return preferences;
}

/** Adds `myVote` to each item, with one DB query for the whole list. */
async function withVotes<T extends { id: string }>(userId: string, section: Section, items: T[]): Promise<WithVote<T>[]> {
  const votes = await getMyVotes(userId, section, items.map((item) => item.id));
  return items.map((item) => ({ ...item, myVote: votes.get(item.id) ?? 0 }));
}

/** Today's date in UTC with no time part: the key for "insight of the day". */
export function todayUtc(now = new Date()): Date {
  return new Date(now.toISOString().slice(0, 10));
}

/** Prices for the user's coins. Throws (→ error card) if CoinGecko is down and nothing is cached. */
export async function getPricesSection(userId: string) {
  const { assets } = await requirePreferences(userId);
  const markets = await getCoinMarkets(assets).catch((err: Error) => {
    console.warn('Prices: CoinGecko failed and nothing is cached.', err.message);
    throw new HttpError(503, 'Live prices are unavailable right now. Try again in a minute.');
  });
  const coins = await withVotes(userId, 'PRICES', markets);
  return { source: 'live' as DataSource, coins };
}

/** News about the user's coins (live or fallback). */
export async function getNewsSection(userId: string) {
  const { assets } = await requirePreferences(userId);
  const news = await getNews(coinsFor(assets));
  return { source: news.source, items: await withVotes(userId, 'NEWS', news.data) };
}

/**
 * The AI insight of the day. Generated once per user per UTC day and stored with its prompt and
 * model, so later reloads are instant and free. A fallback insight is never stored, so the next
 * load tries the LLM again.
 */
export async function getInsightSection(userId: string) {
  const preferences = await requirePreferences(userId);
  const day = todayUtc();

  const stored = await prisma.dailyInsight.findUnique({ where: { userId_day: { userId, day } } });
  if (stored) {
    const [insight] = await withVotes(userId, 'INSIGHT', [{ id: stored.id, text: stored.text, model: stored.model }]);
    return { source: 'live' as DataSource, insight };
  }

  const markets: CoinMarket[] = await getCoinMarkets(preferences.assets).catch(() => []);
  const generated = await generateInsight({
    investorType: investorTypeLabel(preferences.investorType),
    interests: preferences.contentTypes.map(contentTypeLabel),
    markets,
    symbols: symbolsFor(preferences.assets),
  });

  if (generated.source === 'fallback') {
    const id = `fallback-${day.toISOString().slice(0, 10)}`;
    const [insight] = await withVotes(userId, 'INSIGHT', [{ id, text: generated.data.text, model: generated.data.model }]);
    return { source: generated.source, insight };
  }

  // upsert, not create: two tabs loading at once must not fail on the unique (userId, day) key.
  const saved = await prisma.dailyInsight.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, ...generated.data },
    update: {},
  });
  const [insight] = await withVotes(userId, 'INSIGHT', [{ id: saved.id, text: saved.text, model: saved.model }]);
  return { source: generated.source, insight };
}

/** A random meme, skipping ones the user voted down. */
export async function getMemeSection(userId: string) {
  await requirePreferences(userId);
  const meme = await getMeme(await getDownvotedIds(userId, 'MEME'));
  const [withVote] = await withVotes(userId, 'MEME', [meme.data]);
  return { source: meme.source, meme: withVote };
}
