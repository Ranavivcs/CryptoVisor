interface StepProgressProps {
  /** Zero-based index of the current step. */
  current: number;
  total: number;
}

/** "Step 2 of 3" plus a progress bar. */
export function StepProgress({ current, total }: StepProgressProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-400">
        Step {current + 1} of {total}
      </p>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current + 1}
      >
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${((current + 1) / total) * 100}%` }} />
      </div>
    </div>
  );
}
