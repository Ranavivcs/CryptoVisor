import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import type { ContentType, InvestorType, PreferenceOptions } from '../api/preferences';
import { ChoiceCard } from '../components/onboarding/ChoiceCard';
import { StepProgress } from '../components/onboarding/StepProgress';
import { Button } from '../components/ui/Button';
import { useMe } from '../hooks/useAuth';
import { usePreferenceOptions, useSavePreferences } from '../hooks/usePreferences';
import { formErrors } from '../lib/errors';
import { toggle } from '../lib/toggle';

interface Answers {
  assets: string[];
  investorType: InvestorType | null;
  contentTypes: ContentType[];
}

type SetAnswers = (update: (answers: Answers) => Answers) => void;

interface Step {
  title: string;
  hint: string;
  isAnswered: (answers: Answers) => boolean;
  render: (options: PreferenceOptions, answers: Answers, setAnswers: SetAnswers) => ReactNode;
}

/** The quiz as data: adding a question means adding an entry here, not new page logic. */
const STEPS: Step[] = [
  {
    title: 'Which coins are you interested in?',
    hint: 'Pick as many as you like. Prices and news will follow these.',
    isAnswered: (a) => a.assets.length > 0,
    render: (options, answers, setAnswers) =>
      options.coins.map((coin) => (
        <ChoiceCard
          key={coin.id}
          badge={coin.symbol}
          label={coin.name}
          selected={answers.assets.includes(coin.id)}
          onClick={() => setAnswers((a) => ({ ...a, assets: toggle(a.assets, coin.id) }))}
        />
      )),
  },
  {
    title: 'What type of investor are you?',
    hint: 'Pick the one that fits best. It shapes your daily AI insight.',
    isAnswered: (a) => a.investorType !== null,
    render: (options, answers, setAnswers) =>
      options.investorTypes.map((choice) => (
        <ChoiceCard
          key={choice.value}
          label={choice.label}
          description={choice.description}
          selected={answers.investorType === choice.value}
          onClick={() => setAnswers((a) => ({ ...a, investorType: choice.value }))}
        />
      )),
  },
  {
    title: 'What would you like to see?',
    hint: 'Pick one or more. Your favourites go to the top of the dashboard.',
    isAnswered: (a) => a.contentTypes.length > 0,
    render: (options, answers, setAnswers) =>
      options.contentTypes.map((choice) => (
        <ChoiceCard
          key={choice.value}
          label={choice.label}
          description={choice.description}
          selected={answers.contentTypes.includes(choice.value)}
          onClick={() => setAnswers((a) => ({ ...a, contentTypes: toggle(a.contentTypes, choice.value) }))}
        />
      )),
  },
];

/**
 * The onboarding quiz, shown once after the first login. Answers stay in this component's
 * state until the last step, then one PUT saves them all.
 */
export function OnboardingPage() {
  const { data: user } = useMe();
  const optionsQuery = usePreferenceOptions();
  const saveMutation = useSavePreferences();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ assets: [], investorType: null, contentTypes: [] });

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const saveError = formErrors(saveMutation.error).form;

  function next() {
    if (!isLastStep) {
      setStepIndex(stepIndex + 1);
      return;
    }
    if (answers.investorType === null) return; // unreachable: step 2 must be answered to get here
    saveMutation.mutate(
      { assets: answers.assets, investorType: answers.investorType, contentTypes: answers.contentTypes },
      { onSuccess: () => navigate('/', { replace: true }) },
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-4 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Hi {user?.name}, let&apos;s tune your dashboard</h1>
        <p className="text-slate-400">Three quick questions. You can change your answers later.</p>
      </header>

      <StepProgress current={stepIndex} total={STEPS.length} />

      <section aria-labelledby="step-title" className="space-y-4">
        <div>
          <h2 id="step-title" className="text-xl font-semibold">
            {step.title}
          </h2>
          <p className="text-sm text-slate-400">{step.hint}</p>
        </div>

        {optionsQuery.isPending && <p className="text-slate-400">Loading options…</p>}
        {optionsQuery.isError && <p className="text-rose-300">Couldn&apos;t load the questions. Please refresh the page.</p>}
        {optionsQuery.data && (
          <div className="grid gap-3 sm:grid-cols-2">{step.render(optionsQuery.data, answers, setAnswers)}</div>
        )}
      </section>

      {saveError && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {saveError}
        </p>
      )}

      <footer className="flex justify-between">
        <Button variant="ghost" onClick={() => setStepIndex(stepIndex - 1)} disabled={stepIndex === 0}>
          Back
        </Button>
        <Button onClick={next} disabled={!step.isAnswered(answers)} loading={saveMutation.isPending}>
          {isLastStep ? 'Show my dashboard' : 'Next'}
        </Button>
      </footer>
    </main>
  );
}
