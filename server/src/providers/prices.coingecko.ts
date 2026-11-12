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
  sparkline_in_7d?: { price: number[] };
}

const BASE_URL = 'https://api.coingecko.com/api/v3';
const SPARKLINE_POINTS = 42; // one point every 4 hours over 7 days
// CoinGecko's free tier allows a few calls per minute; one call per coin set per minute is safe.
const cache = new TtlCache<CoinMarket[]>(60_000);

/** Keeps every n-th value so a 168-point series becomes about `points` long. */
export function thin(values: number[], points: number): number[] {
  if (values.length <= points) return values;
  const step = values.length / points;
  return Array.from({ length: points }, (_, i) => values[Math.floor(i * step)]);
}

function toCoinMarket(raw: CoinGeckoMarket): CoinMarket {
  return {
    id: raw.id,
    symbol: raw.symbol.toUpperCase(),
    name: raw.name,
    image: raw.image,
    priceUsd: raw.current_price,
    change24hPct: raw.price_change_percentage_24h ?? 0,
    sparkline: thin(raw.sparkline_in_7d?.price ?? [], SPARKLINE_POINTS),
  };
}

/**
 * Current price, 24h change and a 7-day sparkline for the given CoinGecko ids,
 * in the same order as `coinIds`. There's no fake fallback for prices: if CoinGecko is down
 * and nothing is cached, this throws and the card shows an error.
 */
export async function getCoinMarkets(coinIds: string[]): Promise<CoinMarket[]> {
  const ids = [...coinIds].sort();
  const markets = await cache.getOrLoad(ids.join(','), async () => {
    const params = new URLSearchParams({
      vs_currency: 'usd',
      ids: ids.join(','),
      sparkline: 'true',
      price_change_percentage: '24h',
    });
    const headers: Record<string, string> = env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': env.COINGECKO_API_KEY } : {};
    const raw = await fetchJson<CoinGeckoMarket[]>(`${BASE_URL}/coins/markets?${params}`, { headers });
    return raw.map(toCoinMarket);
  });
  const byId = new Map(markets.map((market) => [market.id, market]));
  return coinIds.flatMap((id) => byId.get(id) ?? []);
}

/** For tests. */
export const pricesCache = cache;
