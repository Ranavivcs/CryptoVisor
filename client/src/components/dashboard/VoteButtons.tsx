import type { VoteState } from '../../hooks/useVote';

interface VoteButtonsProps extends VoteState {
  /** Used in the accessible names, e.g. "Like Bitcoin". */
  label: string;
}

/** A thumb outline; filled when active. `down` flips it into a thumbs-down. Drawn by ThumbButton. */
function ThumbIcon({ filled, down }: { filled: boolean; down: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${down ? 'rotate-180' : ''}`} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

/** Everything that differs between the two thumbs, so both are drawn by one ThumbButton. */
const THUMBS = {
  up: {
    value: 1,
    verb: 'Like',
    active: 'border-emerald-400 bg-emerald-500/20 text-emerald-300',
    idle: 'border-transparent text-emerald-400/70 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300',
  },
  down: {
    value: -1,
    verb: 'Dislike',
    active: 'border-rose-400 bg-rose-500/20 text-rose-300',
    idle: 'border-transparent text-rose-400/70 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300',
  },
} as const;

/** One thumb: a toggle button (`aria-pressed`) named "Like X" / "Dislike X". Used twice by VoteButtons. */
function ThumbButton({ kind, vote, cast, label }: { kind: keyof typeof THUMBS; vote: VoteState['vote']; cast: VoteState['cast']; label: string }) {
  const thumb = THUMBS[kind];
  const pressed = vote === thumb.value;
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={`${thumb.verb} ${label}`}
      onClick={() => cast(thumb.value)}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${pressed ? thumb.active : thumb.idle}`}
    >
      <ThumbIcon filled={pressed} down={kind === 'down'} />
    </button>
  );
}

/**
 * Green thumbs-up / red thumbs-down for one item, filled when active, plus a "Saved" / "Not saved"
 * hint. Presentational: the state comes from `useVote` in the parent (CoinRow, NewsRow, InsightBody,
 * MemeBody), so the parent can also react to the vote.
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
      <ThumbButton kind="up" vote={vote} cast={cast} label={label} />
      <ThumbButton kind="down" vote={vote} cast={cast} label={label} />
    </div>
  );
}
