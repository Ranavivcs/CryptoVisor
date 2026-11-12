import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemeSection } from './MemeSection';

/** Each GET /dashboard/meme returns the next meme in the list. */
function mockMemes() {
  let n = 0;
  const fetchMock = vi.fn(async () => {
    n += 1;
    const meme = { id: `m${n}`, title: `meme ${n}`, imageUrl: `https://i.example/${n}.png`, text: null, postUrl: null, myVote: 0 };
    return new Response(JSON.stringify({ source: 'live', meme }), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemeSection />
    </QueryClientProvider>,
  );
  return { fetchMock };
}

afterEach(() => vi.unstubAllGlobals());

describe('MemeSection', () => {
  it('loads another meme when an image fails, and gives up after 3 broken images', async () => {
    const { fetchMock } = mockMemes();

    for (const n of [1, 2]) {
      fireEvent.error(await screen.findByAltText(`meme ${n}`));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(n + 1));
    }
    fireEvent.error(await screen.findByAltText('meme 3'));

    expect(await screen.findByText(/Couldn.t load a meme image/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(3); // no endless retry loop
  });
});
