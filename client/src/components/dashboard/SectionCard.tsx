import type { UseQueryResult } from '@tanstack/react-query';
import { useId, type ReactNode } from 'react';
import type { DataSource } from '../../api/dashboard';

interface SectionCardProps<T extends { source: DataSource }> {
  title: string;
  query: UseQueryResult<T>;
  /** Extra header controls, e.g. a refresh button. */
  actions?: ReactNode;
  className?: string;
  children: (data: T) => ReactNode;
}

/**
 * The shell shared by all four dashboard sections: header, loading skeleton, error with retry,
 * and a "Sample" badge when the section is showing its fallback instead of live data.
 * The body scrolls on its own when the card has a fixed height (the one-screen desktop layout).
 */
export function SectionCard<T extends { source: DataSource }>({ title, query, actions, className = '', children }: SectionCardProps<T>) {
  // useId, not the title: ids can't contain spaces, and aria-labelledby reads spaces as a list of ids.
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={`flex min-h-0 min-w-0 flex-col rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-900/40 p-5 shadow-lg shadow-black/20 ${className}`}
    >
      <header className="mb-3 flex shrink-0 items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <h2 id={headingId} className="flex items-center gap-2 text-base font-semibold tracking-wide text-amber-300">
          <span aria-hidden className="h-4 w-1 rounded-full bg-amber-400" />
          {title}
          {query.data?.source === 'fallback' && (
            <span
              className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400"
              title="The live source is unavailable right now, so this shows built-in content."
            >
              Sample
            </span>
          )}
        </h2>
        {actions}
      </header>

      {/* @container: rows inside can adapt to the card's own width (e.g. hide the sparkline in a narrow column). */}
      <div className="@container flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
        {query.isPending && (
          <div className="space-y-3" role="status" aria-label={`Loading ${title}`}>
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-800" />
          </div>
        )}

        {query.isError && (
          <div className="space-y-2 text-sm">
            <p className="text-rose-300">{query.error.message}</p>
            <button type="button" onClick={() => query.refetch()} className="font-medium text-amber-400 hover:underline">
              Try again
            </button>
          </div>
        )}

        {query.data && children(query.data)}
      </div>
    </section>
  );
}
