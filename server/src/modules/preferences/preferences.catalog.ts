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

function toChoices<T extends string>(text: Record<T, Omit<Choice<T>, 'value'>>): Choice<T>[] {
  return (Object.keys(text) as T[]).map((value) => ({ value, ...text[value] }));
}

export const PREFERENCE_OPTIONS = {
  coins: SUPPORTED_COINS,
  investorTypes: toChoices(investorTypeText),
  contentTypes: toChoices(contentTypeText),
};
