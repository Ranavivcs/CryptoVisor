import { env } from '../config/env.js';
import { TtlCache } from '../lib/cache.js';
import fallbackNews from './data/news.json' with { type: 'json' };
import { fetchCryptoPanicNews } from './news.cryptopanic.js';
import { fetchFeed, RSS_FEEDS } from './news.rss.js';
import type { Sourced } from './types.js';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  /** ISO date, or null for undated explainers in the fallback set. */
  publishedAt: string | null;
  /** Upper-case symbols the story is about, e.g. ["BTC"]. Empty means general market news. */
  coins: string[];
}

/** A coin as the news matcher needs it. */
export interface CoinRef {
  symbol: string;
  name: string;
}

const MAX_ITEMS = 8;
// News changes slowly, and free sources ask clients to cache.
const cryptoPanicCache = new TtlCache<NewsItem[]>(10 * 60_000);
const feedCache = new TtlCache<NewsItem[]>(10 * 60_000);

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Tags each headline with the user's coins it mentions, by name or ticker as a whole word
 * ("Solana", "SOL"), so "solar" doesn't count as Solana.
 */
export function tagCoins(items: NewsItem[], coins: CoinRef[]): NewsItem[] {
  const matchers = coins.map((coin) => ({
    symbol: coin.symbol,
    pattern: new RegExp(`\\b(${escape(coin.name)}|${escape(coin.symbol)})\\b`, 'i'),
  }));
  return items.map((item) => ({
    ...item,
    coins: item.coins.length > 0 ? item.coins : matchers.filter((m) => m.pattern.test(item.title)).map((m) => m.symbol),
  }));
}

const newestFirst = (a: NewsItem, b: NewsItem) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');

/**
 * Stories about the user's coins first, then general market stories (no coin tag), each group
 * newest first; at most MAX_ITEMS. Stories tagged only with other coins are dropped.
 */
export function rankBySymbols(items: NewsItem[], symbols: string[]): NewsItem[] {
  const wanted = new Set(symbols);
  const relevant = items.filter((item) => item.coins.some((coin) => wanted.has(coin))).sort(newestFirst);
  const general = items.filter((item) => item.coins.length === 0).sort(newestFirst);
  return [...relevant, ...general].slice(0, MAX_ITEMS);
}

/**
 * All RSS feeds merged. A feed that fails is skipped, so one outage doesn't empty the card.
 * Mixed-topic feeds only contribute stories about the user's coins.
 */
async function loadRssNews(coins: CoinRef[]): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const tagged = tagCoins(await feedCache.getOrLoad(feed.url, () => fetchFeed(feed)), coins);
      return feed.cryptoOnly ? tagged : tagged.filter((item) => item.coins.length > 0);
    }),
  );
  for (const [i, result] of results.entries()) {
    if (result.status === 'rejected') console.warn(`News: ${RSS_FEEDS[i].sourceName} feed failed.`, (result.reason as Error).message);
  }
  const items = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  const seen = new Set<string>();
  return items.filter((item) => !seen.has(item.url) && seen.add(item.url));
}

/**
 * News for the user's coins, minus stories they voted down. Sources are tried in order, and the
 * first one that returns stories wins:
 * 1. CryptoPanic, the suggested API (only with a paid key, see CRYPTOPANIC_API_KEY)
 * 2. Free RSS feeds (Cointelegraph, CoinDesk, Decrypt), merged
 * 3. Built-in explainer links, marked as fallback
 */
export async function getNews(coins: CoinRef[], excludeIds: Set<string> = new Set()): Promise<Sourced<NewsItem[]>> {
  const symbols = coins.map((coin) => coin.symbol);
  const visible = (items: NewsItem[]) => rankBySymbols(items.filter((item) => !excludeIds.has(item.id)), symbols);

  const apiKey = env.CRYPTOPANIC_API_KEY;
  if (apiKey) {
    try {
      const key = [...symbols].sort().join(',');
      const items = await cryptoPanicCache.getOrLoad(key, () => fetchCryptoPanicNews(apiKey, symbols));
      if (visible(items).length > 0) return { source: 'live', data: visible(items) };
    } catch (err) {
      console.warn('News: CryptoPanic failed, trying RSS.', (err as Error).message);
    }
  }

  const rss = visible(await loadRssNews(coins));
  if (rss.length > 0) return { source: 'live', data: rss };

  return { source: 'fallback', data: visible(fallbackNews) };
}

/** For tests. */
export function clearNewsCaches() {
  cryptoPanicCache.clear();
  feedCache.clear();
}
