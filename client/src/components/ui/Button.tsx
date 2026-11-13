import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  loading?: boolean;
}

const variants = {
  primary: 'bg-amber-400 text-slate-950 hover:bg-amber-300',
  ghost: 'border border-slate-700 text-slate-200 hover:bg-slate-800',
};

/** The app's button (primary or ghost). `loading` disables it so a form can't be submitted twice. Used across pages and the quiz. */
export function Button({ variant = 'primary', loading, disabled, className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`rounded-lg px-4 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
