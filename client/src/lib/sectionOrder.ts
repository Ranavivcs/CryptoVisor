import type { ContentType } from '../api/preferences';

export type DashboardSection = 'insight' | 'prices' | 'news' | 'meme';

/** Which section each content type from the quiz maps to. */
const SECTION_FOR: Record<ContentType, DashboardSection> = {
  MARKET_NEWS: 'news',
  CHARTS: 'prices',
  SOCIAL: 'meme', // the meme feed is community content from Reddit
  FUN: 'meme',
};

const DEFAULT_ORDER: DashboardSection[] = ['prices', 'news', 'meme'];

/**
 * All four sections always show; the user's preferences decide the order.
 * The AI insight stays first (it's the personal summary), then the sections they picked,
 * then the rest. Used by DashboardPage.
 */
export function sectionOrder(contentTypes: ContentType[]): DashboardSection[] {
  const picked = contentTypes.map((type) => SECTION_FOR[type]);
  const ordered = [...new Set([...picked, ...DEFAULT_ORDER])];
  return ['insight', ...ordered];
}
