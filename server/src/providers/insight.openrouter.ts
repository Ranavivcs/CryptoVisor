import { env } from '../config/env.js';
import { fetchJson } from '../lib/http.js';
import type { CoinMarket } from './prices.coingecko.js';
import type { Sourced } from './types.js';

export interface InsightContext {
  /** Investor type label, e.g. "Day Trader". */
  investorType: string;
  /** What that investor type cares about, e.g. "Short-term moves, charts and momentum". */
  investorFocus: string;
  /** A sentence of advice for that investor type, used by the rule-based fallback. */
  investorTip: string;
  /** Content type labels, e.g. ["Market News", "Fun"]. */
  interests: string[];
  /** Today's market data for the user's coins; may be empty if prices are unavailable. */
  markets: CoinMarket[];
  /** Symbols the user picked, used when market data is missing. */
  symbols: string[];
  /** Today's live headlines about the user's coins (a few at most); empty if there are none. */
  headlines: string[];
}

export interface GeneratedInsight {
  text: string;
  /** The model that wrote it, or "fallback". Stored with each insight for later evaluation. */
  model: string;
  prompt: string;
}

interface ChatCompletion {
  model: string;
  choices: { message: { content: string | null } }[];
}

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
/** How many coins get their own "worth watching" line, so the note stays short for big watchlists. */
const MAX_COIN_LINES = 4;
/**
 * The model writes only observations (a takeaway and one line per coin). The advice under it is the
 * rule-based verdict (modules/dashboard/verdict.ts): small free models gave vague or copied advice.
 */
const SYSTEM_PROMPT = [
  'You are a concise crypto market analyst writing a daily note for one investor. Plain text, no markdown, no greeting, under 100 words.',
  'Format exactly, with no labels or headings:',
  'First line: one sentence of at most 25 words, the single most useful takeaway for them today, linking the price moves to their investing style ' +
    '(and to a headline only if it clearly explains a move).',
  `Then one short line for each coin that matters most today (at most ${MAX_COIN_LINES}): the ticker, a colon, and what to keep an eye on.`,
  'Write plainly for everyone: no jargon such as "time horizon", "risk-off", "momentum", "support", "reversal" or "position".',
  "Match their style: the week's trend for long-term holders, today's move for traders, the simplest words for beginners.",
  'Use only the numbers and headlines given. Never mention price levels (like "$66k" or "$1,850"), predictions or events that are not in the data.',
  'Never promise returns. Do not tell them to buy or sell.',
  'Output: the takeaway sentence, then the coin lines, each on its own line. Nothing else.',
].join('\n');

/**
 * Puts each "TICKER: …" on its own line (models sometimes run them into one paragraph), trims
 * each line and drops blank ones, so the card shows a compact list. Used by `generateInsight`.
 */
export const tidy = (text: string) =>
  text
    .replace(/([.!?])\s+(?=[A-Z]{2,6}:)/g, '$1\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

/** "+9.5%" or "-1.2%". Used by `formatMarket`. */
const signedPct = (pct: number) => `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;

/**
 * The 7-day change in percent: the current price against the first point of the 7-day sparkline,
 * or null without a sparkline. Gives the model the week's trend, not just today's move.
 * Used by `formatMarket`.
 */
export function change7dPct(market: CoinMarket): number | null {
  const weekAgo = market.sparkline[0];
  return weekAgo ? (market.priceUsd / weekAgo - 1) * 100 : null;
}

/** One coin as prompt text: "SOL $100 (+9.5% 24h, -3.0% 7d)". Used by `buildInsightPrompt`. */
function formatMarket(m: CoinMarket): string {
  const week = change7dPct(m);
  const changes = [`${signedPct(m.change24hPct)} 24h`, ...(week === null ? [] : [`${signedPct(week)} 7d`])];
  return `${m.symbol} $${m.priceUsd.toLocaleString('en-US')} (${changes.join(', ')})`;
}

/** The user message sent to the LLM; stored with each insight (DailyInsight.prompt). Used by `generateInsight`. */
export function buildInsightPrompt(ctx: InsightContext): string {
  const marketLine = ctx.markets.length > 0 ? ctx.markets.map(formatMarket).join('; ') : ctx.symbols.join(', ');
  const headlines = ctx.headlines.length > 0 ? ["Today's headlines about their coins:", ...ctx.headlines.map((h) => `- ${h}`)] : [];
  return [
    `Investor type: ${ctx.investorType} (cares about: ${ctx.investorFocus.toLowerCase()}).`,
    `Interested in: ${ctx.interests.join(', ')}.`,
    `Their coins today: ${marketLine}.`,
    ...headlines,
    "Write today's insight for them.",
  ].join('\n');
}

/**
 * A rule-based insight used when the LLM is unavailable. It's still personalised:
 * it names the biggest mover among the user's coins, plus a sentence for their investor type.
 * Used by `generateInsight` when there's no key or the LLM call fails.
 */
export function fallbackInsight(ctx: InsightContext): string {
  const mover = [...ctx.markets].sort((a, b) => Math.abs(b.change24hPct) - Math.abs(a.change24hPct))[0];
  const moverLine = mover
    ? `${mover.name} is the biggest mover in your watchlist, ${mover.change24hPct >= 0 ? 'up' : 'down'} ${Math.abs(mover.change24hPct).toFixed(1)}% in 24 hours.`
    : `Your watchlist today: ${ctx.symbols.join(', ')}.`;
  return `${moverLine} ${ctx.investorTip}`;
}

/**
 * Asks a free OpenRouter model for today's insight. `models` lets OpenRouter fall through to the
 * next free model if one is down or rate-limited. Without an API key, or on any failure,
 * returns the rule-based fallback. Called by `getInsightSection` (dashboard.service.ts).
 */
export async function generateInsight(ctx: InsightContext): Promise<Sourced<GeneratedInsight>> {
  const prompt = buildInsightPrompt(ctx);
  if (env.OPENROUTER_API_KEY) {
    try {
      const completion = await fetchJson<ChatCompletion>(API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, 'X-Title': 'CryptoVisor' },
        body: {
          models: env.OPENROUTER_MODELS,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          max_tokens: 400,
          temperature: 0.3, // low: small models follow the format and the data more closely
          // Some free models "think" before answering and can spend the whole token budget on it,
          // returning no text. A 3-sentence note doesn't need reasoning.
          reasoning: { enabled: false },
        },
        timeoutMs: 20_000, // free models can be slow
      });
      const text = tidy(completion.choices[0]?.message.content ?? '');
      if (text) return { source: 'live', data: { text, model: completion.model, prompt } };
      console.warn('Insight: the model returned no text, using fallback.');
    } catch (err) {
      console.warn('Insight: OpenRouter failed, using fallback.', (err as Error).message);
    }
  }
  return { source: 'fallback', data: { text: fallbackInsight(ctx), model: 'fallback', prompt } };
}
