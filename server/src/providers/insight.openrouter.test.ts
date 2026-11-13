import { describe, expect, it } from 'vitest';
import { InvestorType } from '../generated/prisma/enums.js';
import { investorTypeLabel, investorTypeTipFor } from '../modules/preferences/preferences.catalog.js';
import { fallbackInsight } from './insight.openrouter.js';

describe('fallbackInsight', () => {
  it('reads as English for every investor type (no "As a Just Starting")', () => {
    for (const type of Object.values(InvestorType)) {
      const text = fallbackInsight({
        investorType: investorTypeLabel(type),
        investorTip: investorTypeTipFor(type),
        interests: [],
        markets: [],
        symbols: ['BTC'],
      });
      expect(text).toContain(investorTypeTipFor(type));
      expect(text).not.toContain(`As a ${investorTypeLabel(type)}`);
      expect(text).not.toMatch(/\b(buy|sell)\b/i); // general habits only, never trade advice
    }
  });
});
