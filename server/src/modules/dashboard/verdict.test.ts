import { describe, expect, it } from 'vitest';
import type { CoinMarket } from '../../providers/prices.coingecko.js';
import { verdictFor } from './verdict.js';

/** A coin at $100 with the given 24h and 7-day change (the sparkline starts where the week began). */
const coin = (symbol: string, day: number, week = 0): CoinMarket => ({
  id: symbol.toLowerCase(),
  symbol,
  name: symbol,
  image: '',
  priceUsd: 100,
  change24hPct: day,
  lastUpdated: '',
  sparkline: [100 / (1 + week / 100), 100],
});

describe('verdictFor', () => {
  it('calls a calm day and week quiet', () => {
    expect(verdictFor([coin('BTC', 1.2, 4), coin('ETH', -0.5, -2)])).toMatchObject({ level: 'quiet', title: 'Quiet day' });
  });

  it('names the coin that moved most today', () => {
    const verdict = verdictFor([coin('BTC', -1), coin('SOL', -6.3)]);
    expect(verdict).toMatchObject({ level: 'watch', title: 'Worth a look' });
    expect(verdict?.advice).toContain('SOL is down 6.3% today');
  });

  it('points at the week when today is calm but the week was not', () => {
    const verdict = verdictFor([coin('ETH', -1, -15)]);
    expect(verdict).toMatchObject({ level: 'watch' });
    expect(verdict?.advice).toContain('ETH is down 15.0% this week');
  });

  it('flags a big move today before a big week', () => {
    expect(verdictFor([coin('DOGE', 12, 25)])).toMatchObject({ level: 'big', title: 'Big move' });
    expect(verdictFor([coin('DOGE', 2, -25)])).toMatchObject({ level: 'big', title: 'Big week' });
  });

  it('never tells the user to buy or sell, and needs prices', () => {
    for (const markets of [[coin('A', 0)], [coin('A', 5)], [coin('A', 1, 12)], [coin('A', 9)], [coin('A', 1, 30)]]) {
      expect(verdictFor(markets)?.advice).not.toMatch(/\b(buy|sell)\b/i);
    }
    expect(verdictFor([])).toBeNull();
  });
});
