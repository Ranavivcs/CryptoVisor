import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { sendVote, type Vote, type VoteRequest } from '../api/dashboard';

/** What a thumbs control needs to render; spread it into <VoteButtons>. */
export interface VoteState {
  vote: Vote;
  cast: (clicked: 1 | -1) => void;
  /** Changes on every successful save, so a "Saved" hint can restart its animation. */
  savedAt: number | null;
  isError: boolean;
}

/**
 * Thumbs up/down state for one item. Optimistic: the thumb changes immediately and rolls back
 * if the request fails. Clicking the active thumb again removes the vote.
 *
 * `onSaved` runs after the server has stored the vote, e.g. to load a new meme after a 👎
 * (the server must know about the 👎 first, or it could send the same meme back).
 *
 * The state lives in the row or card that owns the thumbs, so a vote re-renders only that part,
 * not the whole dashboard.
 */
export function useVote(request: VoteRequest, initialVote: Vote, onSaved?: (vote: Vote) => void): VoteState {
  const [vote, setVote] = useState<Vote>(initialVote);
  const mutation = useMutation({ mutationFn: (next: Vote) => sendVote(request, next) });

  function cast(clicked: 1 | -1) {
    const previous = vote;
    const next: Vote = previous === clicked ? 0 : clicked;
    setVote(next);
    mutation.mutate(next, {
      onSuccess: () => onSaved?.(next),
      onError: () => setVote(previous),
    });
  }

  return { vote, cast, savedAt: mutation.isSuccess ? mutation.submittedAt : null, isError: mutation.isError };
}
