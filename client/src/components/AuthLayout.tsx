import type { FormEvent, ReactNode } from 'react';
import { Link } from 'react-router';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  onSubmit: () => void;
  /** Form-level error, e.g. "Invalid email or password". */
  error?: string;
  footer: { text: string; linkLabel: string; to: string };
  children: ReactNode;
}

/** The shared card used by the login and signup pages: title, form, error and a link to the other page. */
export function AuthLayout({ title, subtitle, onSubmit, error, footer, children }: AuthLayoutProps) {
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
          {error && (
            <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}
        </form>
        <p className="text-center text-sm text-slate-400">
          {footer.text}{' '}
          <Link to={footer.to} className="font-medium text-amber-400 hover:underline">
            {footer.linkLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
