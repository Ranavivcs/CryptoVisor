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
  coins: CoinMarket[];
}
export interface NewsSection {
  source: DataSource;
  items: NewsItem[];
}
export interface InsightSection {
  source: DataSource;
  insight: Insight;
}
export interface MemeSection {
  source: DataSource;
  meme: Meme;
}

export const fetchPrices = () => apiFetch<PricesSection>('/dashboard/prices');
export const fetchNews = () => apiFetch<NewsSection>('/dashboard/news');
export const fetchInsight = () => apiFetch<InsightSection>('/dashboard/insight');
export const fetchMeme = () => apiFetch<MemeSection>('/dashboard/meme');

export interface VoteRequest {
  section: Section;
  itemId: string;
  /** What the user saw, stored with the vote as a training example. */
  content: Record<string, unknown>;
}

/** Sets a vote (1 or -1), or removes it (0). */
export function sendVote({ section, itemId, content }: VoteRequest, vote: Vote): Promise<unknown> {
  if (vote === 0) {
    return apiFetch(`/feedback/${section}/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
  }
  return apiFetch('/feedback', { method: 'PUT', body: { section, itemId, vote, content } });
}
