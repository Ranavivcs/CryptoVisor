import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { sendVote, type Vote, type VoteRequest } from '../api/dashboard';

/**
 * Thumbs up/down state for one item. Optimistic: the thumb changes immediately and rolls back
 * if the request fails. Clicking the active thumb again removes the vote.
 *
 * The state lives in the card that owns the thumbs, so a vote re-renders that card only,
 * not the whole dashboard.
 */
export function useVote(request: VoteRequest, initialVote: Vote) {
  const [vote, setVote] = useState<Vote>(initialVote);
  const mutation = useMutation({
    mutationFn: (next: Vote) => sendVote(request, next),
  });

  function cast(clicked: 1 | -1) {
    const previous = vote;
    const next: Vote = previous === clicked ? 0 : clicked;
    setVote(next);
    mutation.mutate(next, { onError: () => setVote(previous) });
  }

  return { vote, cast, isError: mutation.isError };
}
