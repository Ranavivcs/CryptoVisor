import { describe, expect, it } from 'vitest';
import { rssFeed } from '../test/fake-apis.js';
import { tagCoins } from './news.js';
import { parseRss } from './news.rss.js';

describe('parseRss', () => {
  it('reads titles, strips tracking parameters, and parses dates', () => {
    const [item] = parseRss(rssFeed(['Ether & Bitcoin rally']), 'Feed');
    expect(item).toMatchObject({
      id: 'rss-https://news.example/0',
      title: 'Ether & Bitcoin rally',
      url: 'https://news.example/0',
      sourceName: 'Feed',
      publishedAt: '2026-11-12T10:30:29.000Z',
      coins: [],
    });
  });

  it('keeps query parameters that are part of the article address', () => {
    const xml = '<rss><channel><item><title>T</title><link>https://n.example/a?id=7&amp;utm_medium=rss&amp;ref=feed</link></item></channel></rss>';
    expect(parseRss(xml, 'Feed')[0].url).toBe('https://n.example/a?id=7');
  });

  it('decodes HTML entities in plain (non-CDATA) titles', () => {
    const xml = '<rss><channel><item><title>Bitcoin &#39;Running on Empty&#39; &amp; more</title><link>https://n.example/1</link></item></channel></rss>';
    expect(parseRss(xml, 'Feed')[0].title).toBe("Bitcoin 'Running on Empty' & more");
  });

  it('returns nothing for a feed with no items or invalid XML structure', () => {
    expect(parseRss('<rss><channel></channel></rss>', 'Feed')).toEqual([]);
    expect(parseRss('not xml at all', 'Feed')).toEqual([]);
  });
});

describe('tagCoins', () => {
  const coins = [
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'LINK', name: 'Chainlink' },
  ];
  const tag = (title: string) =>
    tagCoins([{ id: '1', title, url: 'u', sourceName: 's', publishedAt: null, coins: [] }], coins)[0].coins;

  it('matches names in any case and tickers in capitals, as whole words', () => {
    expect(tag('solana and LINK lead the market')).toEqual(['SOL', 'LINK']);
  });

  it('ignores partial words, and tickers that are ordinary lower-case words', () => {
    expect(tag('Solar farms and linkedin posts')).toEqual([]);
    expect(tag('Coinbase to link accounts with PayPal')).toEqual([]);
  });
});
