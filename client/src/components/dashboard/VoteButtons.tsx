import type { VoteState } from '../../hooks/useVote';

interface VoteButtonsProps extends VoteState {
  /** Used in the accessible names, e.g. "Like Bitcoin". */
  label: string;
}

/** A thumb outline; filled when active. `down` flips it into a thumbs-down. */
function ThumbIcon({ filled, down }: { filled: boolean; down?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${down ? 'rotate-180' : ''}`} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

const base = 'flex h-8 w-8 items-center justify-center rounded-lg border transition';

/**
 * Green thumbs-up / red thumbs-down for one item, filled when active. Presentational: the state
 * comes from `useVote` in the parent, so the parent can also react to the vote.
 */
export function VoteButtons({ vote, cast, savedAt, isError, label }: VoteButtonsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {isError ? (
        <span role="alert" className="text-xs text-rose-300">
          Not saved
        </span>
      ) : (
        savedAt !== null && (
          // key restarts the fade-out animation on each new save; no timer needed.
          <span key={savedAt} role="status" className="animate-fade-out text-xs text-slate-400">
            Saved
          </span>
        )
      )}
      <button
        type="button"
        aria-pressed={vote === 1}
        aria-label={`Like ${label}`}
        onClick={() => cast(1)}
        className={`${base} ${vote === 1 ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300' : 'border-transparent text-emerald-400/70 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300'}`}
      >
        <ThumbIcon filled={vote === 1} />
      </button>
      <button
        type="button"
        aria-pressed={vote === -1}
        aria-label={`Dislike ${label}`}
        onClick={() => cast(-1)}
        className={`${base} ${vote === -1 ? 'border-rose-400 bg-rose-500/20 text-rose-300' : 'border-transparent text-rose-400/70 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300'}`}
      >
        <ThumbIcon filled={vote === -1} down />
      </button>
    </div>
  );
}
