import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Messages from the API for this field; the first one is shown. */
  errors?: string[];
  /** A control shown inside the input on the right, e.g. the show/hide password button. */
  suffix?: ReactNode;
}

/** A labelled input with an inline error message, wired up for screen readers. Used by LoginPage, SignupPage and PasswordField. */
export function TextField({ label, errors, suffix, ...inputProps }: TextFieldProps) {
  const id = useId();
  const error = errors?.[0];
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 aria-invalid:border-rose-500 ${suffix ? 'pr-16' : ''}`}
          {...inputProps}
        />
        {suffix && <div className="absolute inset-y-0 right-1 flex items-center">{suffix}</div>}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
