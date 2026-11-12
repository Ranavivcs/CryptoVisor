import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { DataSource } from '../../api/dashboard';

interface SectionCardProps<T extends { source: DataSource }> {
  title: string;
  icon: string;
  query: UseQueryResult<T>;
  /** Extra header controls, e.g. a refresh button. */
  actions?: ReactNode;
  className?: string;
  children: (data: T) => ReactNode;
}

/**
 * The shell shared by all four dashboard sections: header, loading skeleton, error with retry,
 * and a "sample data" badge when the section is showing its fallback instead of live data.
 */
export function SectionCard<T extends { source: DataSource }>({ title, icon, query, actions, className = '', children }: SectionCardProps<T>) {
  return (
    <section aria-labelledby={`${title}-title`} className={`flex min-w-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 ${className}`}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <h2 id={`${title}-title`} className="flex items-center gap-2 text-lg font-semibold">
          <span aria-hidden>{icon}</span>
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
    </section>
  );
}
