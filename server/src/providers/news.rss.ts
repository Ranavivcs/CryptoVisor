import { XMLParser } from 'fast-xml-parser';
import { fetchText } from '../lib/http.js';
import type { NewsItem } from './news.js';

export interface RssFeed {
  url: string;
  sourceName: string;
  /**
   * true: every story is crypto news, so untagged stories can be shown as general market news.
   * false: the feed mixes in other topics, so only stories about the user's coins are used.
   */
  cryptoOnly: boolean;
}

/**
 * Free, keyless feeds. Each carries only ~7-8 Bitcoin stories over 1-2 days, so we merge
 * several to keep the news card fresh. RSS exists to let other sites show headlines and links.
 */
export const RSS_FEEDS: RssFeed[] = [
  { url: 'https://cointelegraph.com/rss', sourceName: 'Cointelegraph', cryptoOnly: true },
  { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', sourceName: 'CoinDesk', cryptoOnly: true },
  { url: 'https://decrypt.co/feed', sourceName: 'Decrypt', cryptoOnly: false },
];

interface RssItem {
  title?: string;
  link?: string;
  guid?: string | { '#text': string };
  pubDate?: string;
}

// htmlEntities: feeds put entities such as &#39; in plain titles. (CDATA text is literal by the XML spec.)
const parser = new XMLParser({ ignoreAttributes: true, processEntities: true, htmlEntities: true });

/** Query parameters that only track where a click came from (utm_source, ref, …). */
const TRACKING_PARAM = /^(utm_\w+|ref|source|mc_cid|mc_eid)$/i;

/**
 * Removes tracking parameters from a link but keeps the ones the article needs (e.g. `?id=7`).
 * A link that isn't a valid URL is returned unchanged. Used by `parseRss` below.
 */
export function withoutTracking(link: string): string {
  try {
    const url = new URL(link);
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAM.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return link;
  }
}

/**
 * Parses RSS 2.0 XML into news items. Coins are tagged later, per user (see `tagCoins`).
 * Used by `fetchFeed` below, and directly by tests.
 */
export function parseRss(xml: string, sourceName: string): NewsItem[] {
  const parsed = parser.parse(xml);
  const raw: RssItem | RssItem[] | undefined = parsed?.rss?.channel?.item;
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return items.flatMap((item) => {
    const guid = typeof item.guid === 'object' ? item.guid['#text'] : item.guid;
    const url = item.link?.trim();
    if (!item.title || !url) return [];
    const published = item.pubDate ? new Date(item.pubDate) : null;
    return [
      {
        id: `rss-${guid ?? url}`,
        title: String(item.title).trim(),
        url: withoutTracking(url),
        sourceName,
        publishedAt: published && !Number.isNaN(published.getTime()) ? published.toISOString() : null,
        coins: [],
      },
    ];
  });
}

/** Latest headlines from one feed. Called by `loadRssNews` in news.ts, through its cache. */
export async function fetchFeed(feed: RssFeed): Promise<NewsItem[]> {
  return parseRss(await fetchText(feed.url), feed.sourceName);
}
