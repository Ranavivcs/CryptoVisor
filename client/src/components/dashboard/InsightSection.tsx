import type { Insight } from '../../api/dashboard';
import { useInsight } from '../../hooks/useDashboard';
import { useVote } from '../../hooks/useVote';
import { SectionCard, type SectionProps } from './SectionCard';
import { VoteButtons } from './VoteButtons';

/** How the AI starts its closing advice line (BOTTOM_LINE in server/src/providers/insight.openrouter.ts). */
const BOTTOM_LINE = 'Bottom line:';

/**
 * The insight, one paragraph per line: a takeaway, one line per coin, and a highlighted
 * "Bottom line" with the advice. A rule-based or older insight is a single paragraph. Used by InsightBody.
 */
function InsightText({ text }: { text: string }) {
  return (
    <div className="space-y-1 text-base leading-relaxed text-slate-100">
      {text.split('\n').map((line, i) =>
        line.startsWith(BOTTOM_LINE) ? (
          <p key={i} className="mt-2 rounded-lg border-l-2 border-amber-400 bg-amber-400/10 px-3 py-2">
            <span className="font-semibold text-amber-300">{BOTTOM_LINE}</span>
            {line.slice(BOTTOM_LINE.length)}
          </p>
        ) : (
          <p key={i}>{line}</p>
        ),
      )}
    </div>
  );
}

/** The insight text, who wrote it (model or rule-based), and thumbs. Rendered by InsightSection. */
function InsightBody({ insight }: { insight: Insight }) {
  const voting = useVote({ section: 'INSIGHT', itemId: insight.id, content: { text: insight.text, model: insight.model } }, insight.myVote);
  return (
    <div className="flex flex-1 flex-col justify-between gap-4">
      <InsightText text={insight.text} />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {insight.model === 'fallback' ? 'Rule-based summary' : `Written by ${insight.model}`} · Not financial advice
        </p>
        <VoteButtons {...voting} label="today's insight" />
      </div>
    </div>
  );
}

/**
 * The AI Insight of the Day card, written for this user's coins and investor type.
 * Data from GET /api/dashboard/insight (useInsight). Rendered by DashboardPage, always first.
 */
export function InsightSection(props: SectionProps) {
  const query = useInsight();
  return (
    <SectionCard title="AI Insight of the Day" query={query} {...props}>
      {({ insight }) => <InsightBody insight={insight} />}
    </SectionCard>
  );
}
