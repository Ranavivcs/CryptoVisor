import { env } from '../config/env.js';
import { fetchJson } from '../lib/http.js';
import type { CoinMarket } from './prices.coingecko.js';
import type { Sourced } from './types.js';

export interface InsightContext {
  /** Investor type label, e.g. "Day Trader". */
  investorType: string;
  /** A sentence of advice for that investor type, used by the rule-based fallback. */
  investorTip: string;
  /** Content type labels, e.g. ["Market News", "Fun"]. */
  interests: string[];
  /** Today's market data for the user's coins; may be empty if prices are unavailable. */
  markets: CoinMarket[];
  /** Symbols the user picked, used when market data is missing. */
  symbols: string[];
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
const SYSTEM_PROMPT =
  'You are a friendly, concise crypto market analyst writing a daily note for one investor. ' +
  'Write 2-3 sentences, under 80 words, plain text, no markdown, no greeting. ' +
  'Be specific to their coins and style. Never promise returns. Do not tell them to buy or sell.';

function formatMarket(m: CoinMarket): string {
  const sign = m.change24hPct >= 0 ? '+' : '';
  return `${m.symbol} $${m.priceUsd.toLocaleString('en-US')} (${sign}${m.change24hPct.toFixed(1)}% 24h)`;
}

/** The user message sent to the LLM. Exported so it can be stored and tested. */
export function buildInsightPrompt(ctx: InsightContext): string {
  const marketLine = ctx.markets.length > 0 ? ctx.markets.map(formatMarket).join('; ') : ctx.symbols.join(', ');
  return [
    `Investor type: ${ctx.investorType}.`,
    `Interested in: ${ctx.interests.join(', ')}.`,
    `Their coins today: ${marketLine}.`,
    'Write today\'s insight for them.',
  ].join('\n');
}

/**
 * A rule-based insight used when the LLM is unavailable. It's still personalised:
 * it names the biggest mover among the user's coins.
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
 * returns the rule-based fallback.
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
          temperature: 0.7,
          // Some free models "think" before answering and can spend the whole token budget on it,
          // returning no text. A 3-sentence note doesn't need reasoning.
          reasoning: { enabled: false },
        },
        timeoutMs: 20_000, // free models can be slow
      });
      const text = completion.choices[0]?.message.content?.trim();
      if (text) return { source: 'live', data: { text, model: completion.model, prompt } };
      console.warn('Insight: the model returned no text, using fallback.');
    } catch (err) {
      console.warn('Insight: OpenRouter failed, using fallback.', (err as Error).message);
    }
  }
  return { source: 'fallback', data: { text: fallbackInsight(ctx), model: 'fallback', prompt } };
}
