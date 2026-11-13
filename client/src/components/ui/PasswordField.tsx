import { useState, type ComponentProps } from 'react';
import { TextField } from './TextField';

type PasswordFieldProps = Omit<ComponentProps<typeof TextField>, 'type' | 'suffix'>;

/**
 * A password input with a Show/Hide button, so users can check what they typed (fewer failed
 * logins, especially on phones). It's a toggle button (`aria-pressed`), and type="button" so it
 * never submits the form.
 */
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      suffix={
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-pressed={visible}
          aria-label="Show password"
          className="rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      }
    />
  );
}
