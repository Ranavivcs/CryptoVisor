import { useState } from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
import { PasswordField } from '../components/ui/PasswordField';
import { TextField } from '../components/ui/TextField';
import { useRegister } from '../hooks/useAuth';
import { formErrors } from '../lib/errors';

/** /signup (App.tsx, behind GuestOnly). The server signs the new user in, and the guards send them to onboarding. */
export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const registerMutation = useRegister();
  const errors = formErrors(registerMutation.error);

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get a dashboard tuned to how you invest"
      onSubmit={() => registerMutation.mutate({ name, email, password })}
      pending={registerMutation.isPending}
      error={errors.form}
      footer={{ text: 'Already have an account?', linkLabel: 'Sign in', to: '/login' }}
    >
      <TextField label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} errors={errors.fields.name} />
      <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} errors={errors.fields.email} />
      <PasswordField
        label="Password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        errors={errors.fields.password}
      />
      <Button type="submit" loading={registerMutation.isPending} className="w-full">
        Create account
      </Button>
    </AuthLayout>
  );
}
