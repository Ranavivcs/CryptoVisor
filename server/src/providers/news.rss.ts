import { XMLParser } from 'fast-xml-parser';
import { fetchText } from '../lib/http.js';
import type { NewsItem } from './news.js';

/** A free, keyless, crypto-only feed. RSS exists to let other sites show headlines and links. */
export const RSS_FEED = { url: 'https://cointelegraph.com/rss', sourceName: 'Cointelegraph' };

interface RssItem {
  title?: string;
  link?: string;
  guid?: string | { '#text': string };
  pubDate?: string;
}

// htmlEntities: feeds put entities such as &#39; in plain titles. (CDATA text is literal by the XML spec.)
const parser = new XMLParser({ ignoreAttributes: true, processEntities: true, htmlEntities: true });

/** Parses RSS 2.0 XML into news items. Coins are tagged later, per user (see `tagCoins`). */
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
        // Drop the feed's tracking parameters from the link.
        url: url.split('?')[0],
        sourceName,
        publishedAt: published && !Number.isNaN(published.getTime()) ? published.toISOString() : null,
        coins: [],
      },
    ];
  });
}

/** Latest headlines from the RSS feed (all coins). */
export async function fetchRssNews(): Promise<NewsItem[]> {
  return parseRss(await fetchText(RSS_FEED.url), RSS_FEED.sourceName);
}
