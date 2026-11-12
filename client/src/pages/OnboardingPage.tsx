import { useMe } from '../hooks/useAuth';

/** Placeholder: the onboarding quiz is built in the next step. */
export function OnboardingPage() {
  const { data: user } = useMe();
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold">Hi {user?.name}, let&apos;s get to know you</h1>
      <p className="mt-2 text-slate-400">The onboarding quiz goes here.</p>
    </main>
  );
}
