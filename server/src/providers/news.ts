import { env } from '../config/env.js';
import { TtlCache } from '../lib/cache.js';
import fallbackNews from './data/news.json' with { type: 'json' };
import { fetchCryptoPanicNews } from './news.cryptopanic.js';
import { fetchRssNews } from './news.rss.js';
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
const rssCache = new TtlCache<NewsItem[]>(10 * 60_000);

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

/**
 * Stories about the user's coins first, then general market stories (no coin tag); at most
 * MAX_ITEMS. Stories tagged only with other coins are dropped.
 */
export function rankBySymbols(items: NewsItem[], symbols: string[]): NewsItem[] {
  const wanted = new Set(symbols);
  const relevant = items.filter((item) => item.coins.some((coin) => wanted.has(coin)));
  const general = items.filter((item) => item.coins.length === 0);
  return [...relevant, ...general].slice(0, MAX_ITEMS);
}

/**
 * News for the user's coins. Sources are tried in order, and the first one that returns
 * stories wins:
 * 1. CryptoPanic, the suggested API (only with a paid key, see CRYPTOPANIC_API_KEY)
 * 2. Cointelegraph's RSS feed (free, no key)
 * 3. Built-in explainer links, marked as fallback
 */
export async function getNews(coins: CoinRef[]): Promise<Sourced<NewsItem[]>> {
  const symbols = coins.map((coin) => coin.symbol);

  const apiKey = env.CRYPTOPANIC_API_KEY;
  if (apiKey) {
    try {
      const key = [...symbols].sort().join(',');
      const items = await cryptoPanicCache.getOrLoad(key, () => fetchCryptoPanicNews(apiKey, symbols));
      if (items.length > 0) return { source: 'live', data: rankBySymbols(items, symbols) };
    } catch (err) {
      console.warn('News: CryptoPanic failed, trying RSS.', (err as Error).message);
    }
  }

  try {
    const items = await rssCache.getOrLoad('rss', fetchRssNews);
    if (items.length > 0) return { source: 'live', data: rankBySymbols(tagCoins(items, coins), symbols) };
  } catch (err) {
    console.warn('News: RSS feed failed, using built-in news.', (err as Error).message);
  }

  return { source: 'fallback', data: rankBySymbols(fallbackNews, symbols) };
}

/** For tests. */
export function clearNewsCaches() {
  cryptoPanicCache.clear();
  rssCache.clear();
}
