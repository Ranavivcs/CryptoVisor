import { change7dPct } from '../../providers/insight.openrouter.js';
import type { CoinMarket } from '../../providers/prices.coingecko.js';

export type VerdictLevel = 'quiet' | 'watch' | 'big';

/** Today's verdict on the user's coins: a level for the colour, a short title and one sentence of advice. */
export interface Verdict {
  level: VerdictLevel;
  title: string;
  advice: string;
}

/** Moves (in %) from which a coin is worth a look, or counts as a big move. */
const DAY = { watch: 3, big: 8 };
const WEEK = { watch: 10, big: 20 };

/** The coin with the largest absolute value of `pct`. Used by `verdictFor`. */
function biggest(markets: CoinMarket[], pct: (m: CoinMarket) => number) {
  return markets.reduce((top, m) => (Math.abs(pct(m)) > Math.abs(pct(top)) ? m : top));
}

/** "up 6.3%" / "down 6.3%". Used by `verdictFor`. */
const moved = (pct: number) => `${pct >= 0 ? 'up' : 'down'} ${Math.abs(pct).toFixed(1)}%`;

/**
 * A rule-based verdict from today's and this week's moves, shown under the AI insight.
 * Rules, not the LLM, so the advice is consistent, never invented, and works when the LLM is down.
 * It says how much attention the day deserves, never what will happen next and never buy/sell.
 * Returns null without market data. Used by `getInsightSection` (dashboard.service.ts).
 */
export function verdictFor(markets: CoinMarket[]): Verdict | null {
  if (markets.length === 0) return null;
  const weekPct = (m: CoinMarket) => change7dPct(m) ?? 0;
  const day = biggest(markets, (m) => m.change24hPct);
  const week = biggest(markets, weekPct);
  const dayPct = day.change24hPct;
  const wPct = weekPct(week);

  if (Math.abs(dayPct) >= DAY.big) {
    return {
      level: 'big',
      title: 'Big move',
      advice: `${day.symbol} is ${moved(dayPct)} today. Moves this size are hard to read in the moment, so give it a day before changing anything.`,
    };
  }
  if (Math.abs(wPct) >= WEEK.big) {
    return {
      level: 'big',
      title: 'Big week',
      advice: `${week.symbol} is ${moved(wPct)} this week. Read why it moved and check its 7-day chart before changing anything.`,
    };
  }
  if (Math.abs(dayPct) >= DAY.watch) {
    return {
      level: 'watch',
      title: 'Worth a look',
      advice: `${day.symbol} is ${moved(dayPct)} today, the most of your coins. Its news and 7-day chart show whether this is new or part of a trend.`,
    };
  }
  if (Math.abs(wPct) >= WEEK.watch) {
    return {
      level: 'watch',
      title: 'Worth a look',
      advice: `Today is calm, but ${week.symbol} is ${moved(wPct)} this week. Its 7-day chart shows the bigger picture.`,
    };
  }
  return {
    level: 'quiet',
    title: 'Quiet day',
    advice: `Your coins moved less than ${DAY.watch}% today. Nothing needs your attention; check back tomorrow.`,
  };
}
