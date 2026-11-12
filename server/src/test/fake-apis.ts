import { vi } from 'vitest';

type Handler = (url: URL, init?: RequestInit) => unknown;

const FEED_TIME = Date.parse('2026-11-12T10:30:29Z');

/**
 * A minimal RSS 2.0 feed. Headline `i` links to `${base}/${i}` and was published `i + offsetHours`
 * hours before 2026-11-12 10:30:29 UTC, so the first headline is the newest.
 */
export const rssFeed = (titles: string[], { base = 'https://news.example', offsetHours = 0 } = {}) => `<?xml version="1.0"?>
<rss version="2.0"><channel><title>Test feed</title>
${titles
  .map(
    (title, i) => `<item>
  <title><![CDATA[${title}]]></title>
  <link><![CDATA[${base}/${i}?utm_source=rss]]></link>
  <guid isPermaLink="true">${base}/${i}</guid>
  <pubDate>${new Date(FEED_TIME - (i + offsetHours) * 3_600_000).toUTCString()}</pubDate>
</item>`,
  )
  .join('\n')}
</channel></rss>`;

/**
 * Replaces global `fetch` (used only for external APIs) with fakes keyed by host.
 * A handler returns the JSON body, or throws to simulate an outage.
 * Unknown hosts fail loudly, so a test can never reach the real internet.
 */
export function fakeExternalApis(handlers: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const handler = handlers[url.host];
    if (!handler) throw new Error(`Unexpected external call to ${url.host}`);
    const body = handler(url, init);
    // A string is sent as-is (e.g. RSS XML); anything else as JSON.
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  /** How many times a host was called. */
  return { calls: (host: string) => fetchMock.mock.calls.filter(([input]) => new URL(String(input)).host === host).length };
}

export const coinGeckoMarket = (id: string, symbol: string, change: number) => ({
  id,
  symbol,
  name: id[0].toUpperCase() + id.slice(1),
  image: `https://img.example/${id}.png`,
  current_price: 100,
  price_change_percentage_24h: change,
  sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 100 + i) },
});
