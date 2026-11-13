import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router';
import { useIsSlow, WAKING_UP_MESSAGE } from '../hooks/useIsSlow';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  onSubmit: () => void;
  /** The form's request is in flight. After a few seconds this shows the "waking up the server" hint. */
  pending: boolean;
  /** Form-level error, e.g. "Invalid email or password". */
  error?: string;
  footer: { text: string; linkLabel: string; to: string };
  children: ReactNode;
}

/** The shared card used by the login and signup pages: title, form, error and a link to the other page. */
export function AuthLayout({ title, subtitle, onSubmit, pending, error, footer, children }: AuthLayoutProps) {
  const slow = useIsSlow(pending);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <header className="space-y-1 text-center">
          <p className="text-3xl" aria-hidden>
            🪙
          </p>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-slate-400">{subtitle}</p>
        </header>
        <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          {children}
          {slow && (
            <p role="status" className="rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
              {WAKING_UP_MESSAGE}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}
        </form>
        {/* A full-width outlined link, so switching between sign in and sign up is easy to spot. */}
        <Link
          to={footer.to}
          className="block rounded-xl border border-slate-700 px-4 py-3 text-center text-sm text-slate-300 transition hover:border-amber-400/60 hover:bg-slate-900"
        >
          {footer.text} <span className="font-semibold text-amber-400">{footer.linkLabel} →</span>
        </Link>
      </div>
    </main>
  );
}
