interface ChoiceCardProps {
  label: string;
  description?: string;
  /** Short tag shown on the left, e.g. a coin symbol. */
  badge?: string;
  selected: boolean;
  onClick: () => void;
}

/**
 * One selectable answer in the quiz. It's a toggle button (`aria-pressed`), so it works with
 * the keyboard and screen readers for both single- and multi-select questions.
 */
export function ChoiceCard({ label, description, badge, selected, onClick }: ChoiceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
        selected
          ? 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400'
          : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
      }`}
    >
      {badge && (
        <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-amber-300">
          {badge}
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        {description && <span className="block text-sm text-slate-400">{description}</span>}
      </span>
    </button>
  );
}
