import { apiFetch } from './client';

/** 1 = up, -1 = down, 0 = no vote. */
export type Vote = 1 | -1 | 0;
export type DataSource = 'live' | 'fallback';
export type Section = 'NEWS' | 'PRICES' | 'INSIGHT' | 'MEME';

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  priceUsd: number;
  change24hPct: number;
  /** When CoinGecko last updated the price (ISO time). */
  lastUpdated: string;
  sparkline: number[];
  myVote: Vote;
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string | null;
  coins: string[];
  myVote: Vote;
}

export interface Insight {
  id: string;
  text: string;
  model: string;
  myVote: Vote;
}

export interface Meme {
  id: string;
  title: string;
  imageUrl: string | null;
  text: string | null;
  postUrl: string | null;
  myVote: Vote;
}

export interface PricesSection {
  source: DataSource;
  /** The coins the user follows, in their order. */
  coins: CoinMarket[];
  /** The biggest moves over the last 24 hours in the top 100, among coins the user doesn't follow. */
  movers: CoinMarket[];
}
export interface NewsSection {
  source: DataSource;
  items: NewsItem[];
}
/** Today's rule-based verdict on the user's coins (server: modules/dashboard/verdict.ts). */
export interface Verdict {
  level: 'quiet' | 'watch' | 'big';
  title: string;
  advice: string;
}

export interface InsightSection {
  source: DataSource;
  insight: Insight;
  /** Null when prices are unavailable. */
  verdict: Verdict | null;
}
export interface MemeSection {
  source: DataSource;
  meme: Meme;
}

/** GET /api/dashboard/prices. Used by usePrices. */
export const fetchPrices = () => apiFetch<PricesSection>('/dashboard/prices');
/** GET /api/dashboard/news. Used by useNews. */
export const fetchNews = () => apiFetch<NewsSection>('/dashboard/news');
/** GET /api/dashboard/insight. `timeZone` tells the server which calendar day "today" is for this user. Used by useInsight. */
export const fetchInsight = (timeZone: string) =>
  apiFetch<InsightSection>(`/dashboard/insight?${new URLSearchParams({ tz: timeZone })}`);
/** GET /api/dashboard/meme: a new random meme on every call. Used by useMeme. */
export const fetchMeme = () => apiFetch<MemeSection>('/dashboard/meme');

export interface VoteRequest {
  section: Section;
  itemId: string;
  /** What the user saw, stored with the vote as a training example. */
  content: Record<string, unknown>;
}

/** PUT /api/feedback to set a vote (1 or -1), or DELETE to remove it (0). Used by useVote. */
export function sendVote({ section, itemId, content }: VoteRequest, vote: Vote): Promise<unknown> {
  if (vote === 0) {
    return apiFetch(`/feedback/${section}/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
  }
  return apiFetch('/feedback', { method: 'PUT', body: { section, itemId, vote, content } });
}
