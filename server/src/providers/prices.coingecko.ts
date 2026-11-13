import { env } from '../config/env.js';
import { TtlCache } from '../lib/cache.js';
import { fetchJson } from '../lib/http.js';

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  priceUsd: number;
  change24hPct: number;
  /** When CoinGecko last updated this price (ISO time). Shown on the card so users know how fresh it is. */
  lastUpdated: string;
  /** About 7 days of hourly prices, thinned to keep the payload small. */
  sparkline: number[];
}

/** The subset of CoinGecko's /coins/markets response we use. */
interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  last_updated: string;
  sparkline_in_7d?: { price: number[] };
}

const BASE_URL = 'https://api.coingecko.com/api/v3';
const SPARKLINE_POINTS = 42; // one point every 4 hours over 7 days
const TOP_N = 100;
/**
 * One call for the top 100 coins serves every user: it includes all the coins the quiz offers
 * and is the pool for "top movers". CoinGecko's free tier allows a few calls per minute,
 * so one call per minute is safe.
 */
const cache = new TtlCache<CoinMarket[]>(60_000);

/**
 * Picks `points` evenly spaced values, always keeping the first and the last. So the thinned
 * series still spans the whole 7 days and ends at the latest price, which lets the client's
 * chart work out each point's time from the span alone.
 */
export function thin(values: number[], points: number): number[] {
  if (values.length <= points) return values;
  const step = (values.length - 1) / (points - 1);
  return Array.from({ length: points }, (_, i) => values[Math.round(i * step)]);
}

function toCoinMarket(raw: CoinGeckoMarket): CoinMarket {
  return {
    id: raw.id,
    symbol: raw.symbol.toUpperCase(),
    name: raw.name,
    image: raw.image,
    priceUsd: raw.current_price,
    change24hPct: raw.price_change_percentage_24h ?? 0,
    lastUpdated: raw.last_updated,
    sparkline: thin(raw.sparkline_in_7d?.price ?? [], SPARKLINE_POINTS),
  };
}

async function fetchMarkets(params: Record<string, string>): Promise<CoinMarket[]> {
  const query = new URLSearchParams({ vs_currency: 'usd', sparkline: 'true', price_change_percentage: '24h', ...params });
  const headers: Record<string, string> = env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': env.COINGECKO_API_KEY } : {};
  const raw = await fetchJson<CoinGeckoMarket[]>(`${BASE_URL}/coins/markets?${query}`, { headers });
  return raw.map(toCoinMarket);
}

/** The top 100 coins by market cap, cached for a minute. */
function getTopMarkets(): Promise<CoinMarket[]> {
  return cache.getOrLoad('top', () => fetchMarkets({ order: 'market_cap_desc', per_page: String(TOP_N), page: '1' }));
}

/**
 * Price, 24h change and 7-day sparkline for the given CoinGecko ids, in the same order as
 * `coinIds`. Served from the top-100 snapshot; a coin that has dropped out of the top 100
 * is fetched by id. There's no fake fallback for prices: if CoinGecko is down and nothing is
 * cached, this throws.
 */
export async function getCoinMarkets(coinIds: string[]): Promise<CoinMarket[]> {
  const byId = new Map((await getTopMarkets()).map((market) => [market.id, market]));
  const missing = coinIds.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    const extra = await cache.getOrLoad(`ids:${[...missing].sort().join(',')}`, () => fetchMarkets({ ids: missing.join(',') }));
    for (const market of extra) byId.set(market.id, market);
  }
  return coinIds.flatMap((id) => byId.get(id) ?? []);
}

/** The `count` coins with the biggest 24h move (up or down) in the top 100, skipping `excludeIds`. */
export async function getTopMovers(excludeIds: Set<string>, count: number): Promise<CoinMarket[]> {
  return (await getTopMarkets())
    .filter((market) => !excludeIds.has(market.id))
    .sort((a, b) => Math.abs(b.change24hPct) - Math.abs(a.change24hPct))
    .slice(0, count);
}

/** For tests. */
export const pricesCache = cache;
