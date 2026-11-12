interface RequestOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  /** Give up after this long, so a slow API can't hang a dashboard request. */
  timeoutMs?: number;
}

/** Calls an external URL. Throws on network errors, timeouts and non-2xx responses. */
async function request(url: string, accept: string, { method = 'GET', headers = {}, body, timeoutMs = 8000 }: RequestOptions): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: {
      Accept: accept,
      'User-Agent': 'CryptoVisor/1.0 (take-home demo app)',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`${new URL(url).host} responded ${res.status}`);
  }
  return res;
}

/** GET/POST an external JSON API. */
export async function fetchJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  return (await (await request(url, 'application/json', options)).json()) as T;
}

/** GET an external text resource, e.g. an RSS feed. */
export async function fetchText(url: string, options: RequestOptions = {}): Promise<string> {
  return (await request(url, 'application/rss+xml, application/xml, text/xml', options)).text();
}
