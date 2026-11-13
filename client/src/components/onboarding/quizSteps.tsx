import type { ReactNode } from 'react';
import type { ContentType, InvestorType, PreferenceOptions } from '../../api/preferences';
import { toggle } from '../../lib/toggle';
import { ChoiceCard } from './ChoiceCard';

/** The quiz answers while the user is still choosing (investor type can be unset). */
export interface Answers {
  assets: string[];
  investorType: InvestorType | null;
  contentTypes: ContentType[];
}

/** A first-time user's starting point. Used by OnboardingPage when there are no saved preferences. */
export const EMPTY_ANSWERS: Answers = { assets: [], investorType: null, contentTypes: [] };

type SetAnswers = (update: (answers: Answers) => Answers) => void;

/** One question of the quiz: its text, when it counts as answered, and how its choices render. */
export interface Step {
  title: string;
  hint: string;
  isAnswered: (answers: Answers) => boolean;
  render: (options: PreferenceOptions, answers: Answers, setAnswers: SetAnswers) => ReactNode;
}

/**
 * The quiz as data: adding a question means adding an entry here, not new page logic.
 * The options come from the server (GET /api/preferences/options). Used by Quiz.
 */
export const STEPS: Step[] = [
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
