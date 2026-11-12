import { useInsight } from '../../hooks/useDashboard';
import { SectionCard } from './SectionCard';
import { VoteButtons } from './VoteButtons';

/** The AI insight of the day, written for this user's coins and investor type. */
export function InsightSection({ className }: { className?: string }) {
  const query = useInsight();
  return (
    <SectionCard title="AI Insight of the Day" icon="🤖" query={query} className={className}>
      {({ insight }) => (
        <div className="flex flex-1 flex-col justify-between gap-4">
          <p className="text-lg leading-relaxed text-slate-100">{insight.text}</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              {insight.model === 'fallback' ? 'Rule-based summary' : `Written by ${insight.model}`} · Not financial advice
            </p>
            <VoteButtons
              section="INSIGHT"
              itemId={insight.id}
              initialVote={insight.myVote}
              label="today's insight"
              content={{ text: insight.text, model: insight.model }}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
}
