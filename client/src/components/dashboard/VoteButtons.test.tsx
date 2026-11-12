import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Vote } from '../../api/dashboard';
import { useVote } from '../../hooks/useVote';
import { VoteButtons } from './VoteButtons';

/** The same wiring the sections use: useVote in the parent, VoteButtons for the UI. */
function Harness({ onSaved }: { onSaved?: (vote: Vote) => void }) {
  const voting = useVote({ section: 'NEWS', itemId: 'cp-7', content: { title: 'Story' } }, 0, onSaved);
  return <VoteButtons {...voting} label="the story" />;
}

function renderButtons(fetchImpl: () => Promise<Response>, onSaved?: (vote: Vote) => void) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(fetchImpl);
  vi.stubGlobal('fetch', fetchMock);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Harness onSaved={onSaved} />
    </QueryClientProvider>,
  );
  return fetchMock;
}

const like = () => screen.getByRole('button', { name: 'Like the story' });
const ok = () => Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));

afterEach(() => vi.unstubAllGlobals());

describe('useVote + VoteButtons', () => {
  it('saves a like, then removes it when clicked again', async () => {
    const onSaved = vi.fn();
    const fetchMock = renderButtons(ok, onSaved);

    fireEvent.click(like());
    expect(like()).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(1));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/feedback');
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ section: 'NEWS', itemId: 'cp-7', vote: 1 });
    expect(screen.getByRole('status')).toHaveTextContent('Saved');

    fireEvent.click(like());
    expect(like()).toHaveAttribute('aria-pressed', 'false');
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(0));
    expect(fetchMock.mock.calls[1][0]).toBe('/api/feedback/NEWS/cp-7');
  });

  it('rolls the thumb back if saving fails, and does not report it as saved', async () => {
    const onSaved = vi.fn();
    renderButtons(() => Promise.resolve(new Response(JSON.stringify({ error: 'boom' }), { status: 500 })), onSaved);

    fireEvent.click(like());
    expect(like()).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(like()).toHaveAttribute('aria-pressed', 'false'));
    expect(screen.getByRole('alert')).toHaveTextContent('Not saved');
    expect(onSaved).not.toHaveBeenCalled();
  });
});
