import { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
import { PasswordField } from '../components/ui/PasswordField';
import { TextField } from '../components/ui/TextField';
import { useLogin } from '../hooks/useAuth';
import { formErrors } from '../lib/errors';

/** Login page. On success the route guards redirect to onboarding or the dashboard. */
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLogin();
  const errors = formErrors(loginMutation.error);

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your crypto dashboard"
      onSubmit={() => loginMutation.mutate({ email, password })}
      pending={loginMutation.isPending}
      error={errors.form}
      footer={{ text: 'New here?', linkLabel: 'Create an account', to: '/signup' }}
    >
      <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} errors={errors.fields.email} />
      <PasswordField
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        errors={errors.fields.password}
      />
      <Button type="submit" loading={loginMutation.isPending} className="w-full">
        Sign in
      </Button>
    </AuthLayout>
  );
}
