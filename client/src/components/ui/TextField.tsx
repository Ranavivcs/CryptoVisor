import { useId, type InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Messages from the API for this field; the first one is shown. */
  errors?: string[];
}

/** A labelled input with an inline error message, wired up for screen readers. */
export function TextField({ label, errors, ...inputProps }: TextFieldProps) {
  const id = useId();
  const error = errors?.[0];
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 aria-invalid:border-rose-500"
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
