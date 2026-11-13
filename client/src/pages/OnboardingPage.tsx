import { Quiz } from '../components/onboarding/Quiz';
import { EMPTY_ANSWERS } from '../components/onboarding/quizSteps';
import { useMe } from '../hooks/useAuth';
import { usePreferenceOptions, usePreferences } from '../hooks/usePreferences';

/**
 * /onboarding: the quiz, shown once after the first login (the route guard sends users without
 * preferences here) and again from "Edit preferences" on the dashboard. It waits for the quiz
 * options and the saved answers, so editing starts from what the user already chose
 * (a first-timer has none and starts empty). Route set up in App.tsx.
 */
export function OnboardingPage() {
  const { data: user } = useMe();
  const optionsQuery = usePreferenceOptions();
  const preferencesQuery = usePreferences();
  const isEditing = Boolean(user?.hasPreferences);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit your preferences' : <>Hi {user?.name}, let&apos;s tune your dashboard</>}</h1>
        <p className="text-slate-400">
          {isEditing ? 'Your current answers are already selected. Change what you like.' : 'Three quick questions. You can change your answers later.'}
        </p>
      </header>

      {(optionsQuery.isPending || preferencesQuery.isPending) && <p className="text-slate-400">Loading options…</p>}
      {(optionsQuery.isError || preferencesQuery.isError) && (
        <p className="text-rose-300">Couldn&apos;t load the questions. Please refresh the page.</p>
      )}
      {optionsQuery.data && preferencesQuery.isSuccess && (
        <Quiz options={optionsQuery.data} initialAnswers={preferencesQuery.data ?? EMPTY_ANSWERS} isEditing={isEditing} />
      )}
    </main>
  );
}
