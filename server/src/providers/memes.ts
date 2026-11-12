import { TtlCache } from '../lib/cache.js';
import { fetchJson } from '../lib/http.js';
import fallbackMemes from './data/memes.json' with { type: 'json' };
import type { Sourced } from './types.js';

export interface Meme {
  id: string;
  title: string;
  /** Image memes from Reddit have an image; fallback memes are text-only. */
  imageUrl: string | null;
  text: string | null;
  postUrl: string | null;
}

/** The subset of meme-api.com's response we use (a public proxy over Reddit's JSON). */
interface MemeApiPost {
  postLink: string;
  title: string;
  url: string;
  nsfw: boolean;
  spoiler: boolean;
}

const API_URL = 'https://meme-api.com/gimme/cryptocurrencymemes/30';
const IMAGE_URL = /\.(png|jpe?g|gif|webp)$/i;
const cache = new TtlCache<Meme[]>(30 * 60_000);

function toMeme(post: MemeApiPost): Meme {
  return {
    id: `reddit-${post.postLink.split('/').pop()}`,
    title: post.title,
    imageUrl: post.url,
    text: null,
    postUrl: post.postLink,
  };
}

async function loadRedditMemes(): Promise<Meme[]> {
  const { memes } = await fetchJson<{ memes: MemeApiPost[] }>(API_URL);
  // Keep the dashboard work-safe: skip NSFW and spoiler posts, and anything that isn't an image.
  const usable = memes.filter((post) => !post.nsfw && !post.spoiler && IMAGE_URL.test(post.url)).map(toMeme);
  if (usable.length === 0) throw new Error('No usable memes');
  return usable;
}

/** Random pick that avoids `excludeIds` when possible. `random` is injectable for tests. */
export function pickMeme(memes: Meme[], excludeIds: Set<string>, random = Math.random): Meme {
  const candidates = memes.filter((meme) => !excludeIds.has(meme.id));
  const pool = candidates.length > 0 ? candidates : memes;
  return pool[Math.floor(random() * pool.length)];
}

/**
 * A random crypto meme, different on each call. Skips memes the user voted down
 * (`excludeIds`), which is the simplest use of their feedback.
 */
export async function getMeme(excludeIds: Set<string>): Promise<Sourced<Meme>> {
  try {
    const memes = await cache.getOrLoad('reddit', loadRedditMemes);
    return { source: 'live', data: pickMeme(memes, excludeIds) };
  } catch (err) {
    console.warn('Memes: Reddit feed failed, using fallback.', (err as Error).message);
    return { source: 'fallback', data: pickMeme(fallbackMemes, excludeIds) };
  }
}

/** For tests. */
export const memesCache = cache;
