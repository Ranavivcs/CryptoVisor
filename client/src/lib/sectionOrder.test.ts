import { describe, expect, it } from 'vitest';
import { sectionOrder } from './sectionOrder';

describe('sectionOrder', () => {
  it('always shows all four sections, insight first', () => {
    expect(sectionOrder([])).toEqual(['insight', 'prices', 'news', 'meme']);
  });

  it('puts the picked content first, in the order picked', () => {
    expect(sectionOrder(['FUN', 'MARKET_NEWS'])).toEqual(['insight', 'meme', 'news', 'prices']);
  });

  it('lists a section once even if two content types map to it', () => {
    expect(sectionOrder(['SOCIAL', 'FUN'])).toEqual(['insight', 'meme', 'prices', 'news']);
  });
});
