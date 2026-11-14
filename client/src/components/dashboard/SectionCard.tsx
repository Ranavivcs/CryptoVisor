import type { UseQueryResult } from '@tanstack/react-query';
import { useId, type ReactNode } from 'react';
import type { DataSource } from '../../api/dashboard';
import { ErrorBoundary } from '../ErrorBoundary';

/** What DashboardPage passes to every section component, which hands it on to SectionCard. */
export interface SectionProps {
  className?: string;
  /** Collapsed: only the header shows. The data still loads, so expanding is instant. */
  collapsed?: boolean;
  /** Shows the collapse/expand button when given. */
  onToggleCollapse?: () => void;
}

interface SectionCardProps<T extends { source: DataSource }> extends SectionProps {
  title: string;
  query: UseQueryResult<T>;
  /** Extra header controls, e.g. a refresh button. Hidden while collapsed. */
  actions?: ReactNode;
  children: (data: T) => ReactNode;
}

/** A chevron that points down when the card is open and right when it's collapsed. Drawn by CollapseButton. */
function Chevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${collapsed ? '-rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** The header button that folds a card away or opens it again (`aria-expanded`). Used by SectionCard. */
function CollapseButton({ title, collapsed, onToggle }: { title: string; collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={!collapsed}
      aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${title}`}
      title={collapsed ? 'Show' : 'Hide'}
      onClick={onToggle}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    >
      <Chevron collapsed={collapsed} />
    </button>
  );
}

/**
 * Calls a section's render function as its own component. Calling `children(data)` directly in
 * SectionCard would run it while SectionCard renders, outside the ErrorBoundary, so an error there
 * would still blank the page. (A test caught exactly that.)
 */
function Content({ render }: { render: () => ReactNode }) {
  return render();
}

/** An error line with a "Try again" button. Used for a failed request and for a render error. */
function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-rose-300">{message}</p>
      <button type="button" onClick={onRetry} className="font-medium text-amber-400 hover:underline">
        Try again
      </button>
    </div>
  );
}

/**
 * The shell shared by all four dashboard sections: header, loading skeleton, error with retry,
 * and a "Sample" badge when the section is showing its fallback instead of live data.
 * The body scrolls on its own when the card has a fixed height (the one-screen desktop layout).
 * Used by all four section components (Prices, News, Insight, Meme): a render-props shell, so each
 * section only describes its own content.
 */
export function SectionCard<T extends { source: DataSource }>({
  title,
  query,
  actions,
  className = '',
  collapsed = false,
  onToggleCollapse,
  children,
}: SectionCardProps<T>) {
  // useId, not the title: ids can't contain spaces, and aria-labelledby reads spaces as a list of ids.
  const headingId = useId();
  const data = query.data; // a local, so TypeScript keeps "defined" inside the render callback below
  return (
    <section
      aria-labelledby={headingId}
      className={`flex min-h-0 min-w-0 flex-col rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-900/40 shadow-lg shadow-black/20 ${collapsed ? 'px-5 py-3' : 'p-5'} ${className}`}
    >
      <header className={`flex shrink-0 items-center justify-between gap-2 ${collapsed ? '' : 'mb-3 border-b border-slate-800 pb-3'}`}>
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
        <div className="flex items-center gap-1">
          {!collapsed && actions}
          {onToggleCollapse && <CollapseButton title={title} collapsed={collapsed} onToggle={onToggleCollapse} />}
        </div>
      </header>

      {/* @container: rows inside can adapt to the card's own width (e.g. hide the sparkline in a narrow column). */}
      <div className="@container flex min-h-0 flex-1 flex-col overflow-y-auto pr-1" hidden={collapsed}>
        {query.isPending && (
          <div className="space-y-3" role="status" aria-label={`Loading ${title}`}>
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-800" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-800" />
          </div>
        )}

        {query.isError && <ErrorMessage message={query.error.message} onRetry={() => query.refetch()} />}

        {data !== undefined && (
          <ErrorBoundary
            fallback={(reset) => (
              <ErrorMessage
                message="Something went wrong showing this section."
                onRetry={() => {
                  reset();
                  void query.refetch();
                }}
              />
            )}
          >
            <Content render={() => children(data)} />
          </ErrorBoundary>
        )}
      </div>
    </section>
  );
}
