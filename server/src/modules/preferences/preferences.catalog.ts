import type { ContentType, InvestorType } from '../../generated/prisma/enums.js';

/**
 * The answer choices for the onboarding quiz. The server owns this list and the client
 * fetches it (GET /api/preferences/options), so the options are defined in one place.
 */

export interface Coin {
  /** CoinGecko coin id, also what we store in Preferences.assets. */
  id: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_COINS: readonly Coin[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
];

export const SUPPORTED_COIN_IDS = SUPPORTED_COINS.map((coin) => coin.id);

interface Choice<T extends string> {
  value: T;
  label: string;
  description: string;
}

// `Record<InvestorType, ...>` makes TypeScript fail the build if an enum value has no label.
const investorTypeText: Record<InvestorType, Omit<Choice<InvestorType>, 'value'>> = {
  HODLER: { label: 'HODLer', description: 'Buy, hold and ride out the volatility' },
  DAY_TRADER: { label: 'Day Trader', description: 'Short-term moves, charts and momentum' },
  NFT_COLLECTOR: { label: 'NFT Collector', description: 'Digital art, collections and drops' },
  DEFI_EXPLORER: { label: 'DeFi Explorer', description: 'Yield, staking and on-chain protocols' },
  NEWCOMER: { label: 'Just Starting', description: 'Learning the basics, keep it simple' },
};

const contentTypeText: Record<ContentType, Omit<Choice<ContentType>, 'value'>> = {
  MARKET_NEWS: { label: 'Market News', description: 'Headlines that move the market' },
  CHARTS: { label: 'Charts', description: 'Prices and 24h performance' },
  SOCIAL: { label: 'Social', description: 'What the community is talking about' },
  FUN: { label: 'Fun', description: 'Memes and lighter takes' },
};

/** A label map → the `{ value, label, description }[]` list the quiz renders. Used by PREFERENCE_OPTIONS below. */
function toChoices<T extends string>(text: Record<T, Omit<Choice<T>, 'value'>>): Choice<T>[] {
  return (Object.keys(text) as T[]).map((value) => ({ value, ...text[value] }));
}

export const PREFERENCE_OPTIONS = {
  coins: SUPPORTED_COINS,
  investorTypes: toChoices(investorTypeText),
  contentTypes: toChoices(contentTypeText),
};

/** Human-readable label for an investor type, e.g. "Day Trader". Used to build the insight context (dashboard.service.ts). */
export const investorTypeLabel = (type: InvestorType) => investorTypeText[type].label;

/** What an investor type cares about, e.g. "Short-term moves, charts and momentum" (the quiz option's description). Used to build the insight context. */
export const investorTypeFocus = (type: InvestorType) => investorTypeText[type].description;

/**
 * One sentence per investor type for the rule-based insight (used when the LLM is unavailable).
 * Whole sentences, because the labels don't fit one template: "As a Just Starting…" isn't English.
 * General risk habits only, never "buy" or "sell". Kept apart from the quiz options so they aren't sent to the client.
 */
const investorTypeTip: Record<InvestorType, string> = {
  HODLER: 'As a long-term holder, zoom out: one day matters less than your plan and your time horizon.',
  DAY_TRADER: "As a day trader, moves like this are where the action is, so decide your exit before you enter and keep positions small.",
  NFT_COLLECTOR: "As an NFT collector, watch how the market's mood spills into floor prices and trading volume.",
  DEFI_EXPLORER: 'As a DeFi explorer, remember that price swings also move your collateral and yields, so check the health of your positions.',
  NEWCOMER: "If you're just starting out, swings like this are normal in crypto: only put in what you can afford to see move, and keep learning the basics.",
};

/** The fallback insight's sentence for an investor type. Used to build the insight context (dashboard.service.ts). */
export const investorTypeTipFor = (type: InvestorType) => investorTypeTip[type];

/** Human-readable label for a content type, e.g. "Market News". Used to build the insight context (dashboard.service.ts). */
export const contentTypeLabel = (type: ContentType) => contentTypeText[type].label;

/** The catalog entries for CoinGecko ids, in the same order; unknown ids are skipped. Used by the news section (names for coin tagging). */
export function coinsFor(coinIds: string[]): Coin[] {
  return coinIds.flatMap((id) => SUPPORTED_COINS.find((coin) => coin.id === id) ?? []);
}

/** Ticker symbols for CoinGecko ids, e.g. ["bitcoin"] → ["BTC"]. Used by the insight context. */
export function symbolsFor(coinIds: string[]): string[] {
  return coinsFor(coinIds).map((coin) => coin.symbol);
}
