import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VoteButtons } from './VoteButtons';

function renderButtons(fetchImpl: () => Promise<Response>) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(fetchImpl);
  vi.stubGlobal('fetch', fetchMock);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <VoteButtons section="NEWS" itemId="cp-7" initialVote={0} label="the story" content={{ title: 'Story' }} />
    </QueryClientProvider>,
  );
  return fetchMock;
}

const like = () => screen.getByRole('button', { name: 'Like the story' });
const ok = () => Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));

afterEach(() => vi.unstubAllGlobals());

describe('VoteButtons', () => {
  it('saves a like, then removes it when clicked again', async () => {
    const fetchMock = renderButtons(ok);

    fireEvent.click(like());
    expect(like()).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/feedback');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      section: 'NEWS',
      itemId: 'cp-7',
      vote: 1,
    });

    fireEvent.click(like());
    expect(like()).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe('/api/feedback/NEWS/cp-7');
  });

  it('rolls the thumb back if saving fails', async () => {
    renderButtons(() => Promise.resolve(new Response(JSON.stringify({ error: 'boom' }), { status: 500 })));

    fireEvent.click(like());
    expect(like()).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'false'));
    expect(screen.getByRole('alert')).toHaveTextContent('Not saved');
  });
});
