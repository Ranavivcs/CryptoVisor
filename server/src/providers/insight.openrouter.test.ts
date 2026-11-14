import { describe, expect, it } from 'vitest';
import { InvestorType } from '../generated/prisma/enums.js';
import { investorTypeFocus, investorTypeLabel, investorTypeTipFor } from '../modules/preferences/preferences.catalog.js';
import { buildInsightPrompt, change7dPct, fallbackInsight, tidy, type InsightContext } from './insight.openrouter.js';
import type { CoinMarket } from './prices.coingecko.js';

const market = (over: Partial<CoinMarket>): CoinMarket => ({
  id: 'solana',
  symbol: 'SOL',
  name: 'Solana',
  image: '',
  priceUsd: 90,
  change24hPct: -2,
  lastUpdated: '2026-11-14T10:00:00Z',
  sparkline: [100, 95, 90],
  ...over,
});

const context = (over: Partial<InsightContext> = {}): InsightContext => ({
  investorType: investorTypeLabel('HODLER'),
  investorFocus: investorTypeFocus('HODLER'),
  investorTip: investorTypeTipFor('HODLER'),
  interests: ['Charts'],
  markets: [market({})],
  symbols: ['SOL'],
  headlines: [],
  ...over,
});

describe('change7dPct', () => {
  it('compares the current price with the start of the 7-day sparkline', () => {
    expect(change7dPct(market({}))).toBeCloseTo(-10);
    expect(change7dPct(market({ sparkline: [] }))).toBeNull();
  });
});

describe('buildInsightPrompt', () => {
  it('includes the 24h and 7d change, and the investor focus', () => {
    const prompt = buildInsightPrompt(context());
    expect(prompt).toContain('SOL $90 (-2.0% 24h, -10.0% 7d)');
    expect(prompt).toContain('HODLer (cares about: buy, hold and ride out the volatility)');
  });

  it('lists headlines only when there are some', () => {
    expect(buildInsightPrompt(context())).not.toContain('headlines');
    expect(buildInsightPrompt(context({ headlines: ['Solana ETF filed'] }))).toContain("Today's headlines about their coins:\n- Solana ETF filed");
  });
});

describe('tidy', () => {
  it('puts each coin line on its own line and drops blank lines', () => {
    expect(tidy('Takeaway here. BTC: one thing. DOGE: another.')).toBe('Takeaway here.\nBTC: one thing.\nDOGE: another.');
    expect(tidy('  Takeaway.\n\n SOL: watch it.  ')).toBe('Takeaway.\nSOL: watch it.');
  });
});

describe('fallbackInsight', () => {
  it('reads as English for every investor type (no "As a Just Starting")', () => {
    for (const type of Object.values(InvestorType)) {
      const text = fallbackInsight(
        context({ investorType: investorTypeLabel(type), investorTip: investorTypeTipFor(type), markets: [], symbols: ['BTC'] }),
      );
      expect(text).toContain(investorTypeTipFor(type));
      expect(text).not.toContain(`As a ${investorTypeLabel(type)}`);
      expect(text).not.toMatch(/\b(buy|sell)\b/i); // general habits only, never trade advice
    }
  });
});
