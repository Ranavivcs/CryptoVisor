import type { Insight } from '../../api/dashboard';
import { useInsight } from '../../hooks/useDashboard';
import { useVote } from '../../hooks/useVote';
import { SectionCard } from './SectionCard';
import { VoteButtons } from './VoteButtons';

function InsightBody({ insight }: { insight: Insight }) {
  const voting = useVote({ section: 'INSIGHT', itemId: insight.id, content: { text: insight.text, model: insight.model } }, insight.myVote);
  return (
    <div className="flex flex-1 flex-col justify-between gap-4">
      <p className="text-base leading-relaxed text-slate-100 sm:text-lg">{insight.text}</p>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {insight.model === 'fallback' ? 'Rule-based summary' : `Written by ${insight.model}`} · Not financial advice
        </p>
        <VoteButtons {...voting} label="today's insight" />
      </div>
    </div>
  );
}

/** The AI insight of the day, written for this user's coins and investor type. */
export function InsightSection({ className }: { className?: string }) {
  const query = useInsight();
  return (
    <SectionCard title="AI Insight of the Day" query={query} className={className}>
      {({ insight }) => <InsightBody insight={insight} />}
    </SectionCard>
  );
}
