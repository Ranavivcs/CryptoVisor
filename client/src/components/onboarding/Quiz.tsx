import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { PreferenceOptions } from '../../api/preferences';
import { useSavePreferences } from '../../hooks/usePreferences';
import { formErrors } from '../../lib/errors';
import { Button } from '../ui/Button';
import { STEPS, type Answers } from './quizSteps';
import { StepProgress } from './StepProgress';

interface QuizProps {
  options: PreferenceOptions;
  /** Read once, on mount. OnboardingPage mounts the quiz only after the saved answers load, so no syncing is needed. */
  initialAnswers: Answers;
  /** Opened from "Edit preferences": Back on the first step returns to the dashboard instead of being disabled. */
  isEditing: boolean;
}

/**
 * The quiz steps (from quizSteps.tsx) with progress, Back/Next, and the save. Answers stay in this
 * component's state until the last step, then one PUT /api/preferences saves them all
 * (useSavePreferences), and the user lands on the dashboard. Rendered by OnboardingPage.
 */
export function Quiz({ options, initialAnswers, isEditing }: QuizProps) {
  const saveMutation = useSavePreferences();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);

  const step = STEPS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;
  const saveError = formErrors(saveMutation.error).form;

  /** Previous step, or back to the dashboard from the first step when editing. */
  function back() {
    if (isFirstStep) navigate('/');
    else setStepIndex(stepIndex - 1);
  }

  /** Next step, or save everything on the last one. */
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
    <>
      <StepProgress current={stepIndex} total={STEPS.length} />

      <section aria-labelledby="step-title" className="space-y-4">
        <div>
          <h2 id="step-title" className="text-xl font-semibold">
            {step.title}
          </h2>
          <p className="text-sm text-slate-400">{step.hint}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">{step.render(options, answers, setAnswers)}</div>
      </section>

      {saveError && (
        <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {saveError}
        </p>
      )}

      <footer className="flex justify-between">
        <Button variant="ghost" onClick={back} disabled={isFirstStep && !isEditing}>
          {isFirstStep && isEditing ? 'Back to dashboard' : 'Back'}
        </Button>
        <Button onClick={next} disabled={!step.isAnswered(answers)} loading={saveMutation.isPending}>
          {isLastStep ? (isEditing ? 'Save changes' : 'Show my dashboard') : 'Next'}
        </Button>
      </footer>
    </>
  );
}
