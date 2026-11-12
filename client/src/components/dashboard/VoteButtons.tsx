import type { Vote, VoteRequest } from '../../api/dashboard';
import { useVote } from '../../hooks/useVote';

interface VoteButtonsProps extends VoteRequest {
  initialVote: Vote;
  /** Used in the accessible names, e.g. "Like Bitcoin". */
  label: string;
}

const base = 'rounded-md px-2 py-1 text-sm transition hover:bg-slate-800';

/** 👍 / 👎 for one item. Each click is saved to the API as feedback. */
export function VoteButtons({ initialVote, label, ...request }: VoteButtonsProps) {
  const { vote, cast, isError } = useVote(request, initialVote);
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-pressed={vote === 1}
        aria-label={`Like ${label}`}
        onClick={() => cast(1)}
        className={`${base} ${vote === 1 ? 'bg-emerald-500/20 ring-1 ring-emerald-400' : 'opacity-60 hover:opacity-100'}`}
      >
        👍
      </button>
      <button
        type="button"
        aria-pressed={vote === -1}
        aria-label={`Dislike ${label}`}
        onClick={() => cast(-1)}
        className={`${base} ${vote === -1 ? 'bg-rose-500/20 ring-1 ring-rose-400' : 'opacity-60 hover:opacity-100'}`}
      >
        👎
      </button>
      {isError && (
        <span role="alert" className="text-xs text-rose-300">
          Not saved
        </span>
      )}
    </div>
  );
}
