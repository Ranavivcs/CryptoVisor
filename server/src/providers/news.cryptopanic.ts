import { fetchJson } from '../lib/http.js';
import type { NewsItem } from './news.js';

/** The subset of CryptoPanic's v2 /posts response we use. Fields vary by plan, so most are optional. */
interface CryptoPanicPost {
  id: number;
  slug?: string;
  title: string;
  published_at: string;
  original_url?: string;
  url?: string;
  source?: { title?: string };
  instruments?: { code: string }[];
  currencies?: { code: string }[];
}

const API_URL = 'https://cryptopanic.com/api/developer/v2/posts/';

/** CryptoPanic post → our NewsItem (CryptoPanic tags coins itself). Used by `fetchCryptoPanicNews`. */
function toNewsItem(post: CryptoPanicPost): NewsItem {
  return {
    id: `cp-${post.id}`,
    title: post.title,
    url: post.original_url ?? post.url ?? `https://cryptopanic.com/news/${post.id}/${post.slug ?? ''}`,
    sourceName: post.source?.title ?? 'CryptoPanic',
    publishedAt: post.published_at,
    coins: (post.instruments ?? post.currencies ?? []).map((c) => c.code.toUpperCase()),
  };
}

/**
 * News filtered by coin symbols from CryptoPanic, the source the assignment suggests.
 * Its API now requires a paid plan, so this runs only when CRYPTOPANIC_API_KEY is set.
 * Called by `getNews` (news.ts), through its cache.
 */
export async function fetchCryptoPanicNews(apiKey: string, symbols: string[]): Promise<NewsItem[]> {
  const params = new URLSearchParams({ auth_token: apiKey, public: 'true', kind: 'news', currencies: symbols.join(',') });
  const { results } = await fetchJson<{ results: CryptoPanicPost[] }>(`${API_URL}?${params}`);
  return results.map(toNewsItem);
}
