import type { Insight, Verdict } from '../../api/dashboard';
import { useInsight } from '../../hooks/useDashboard';
import { useVote } from '../../hooks/useVote';
import { SectionCard, type SectionProps } from './SectionCard';
import { VoteButtons } from './VoteButtons';

/** Colours per verdict level: green for a quiet day, amber worth a look, rose for a big move. */
const VERDICT_STYLE: Record<Verdict['level'], { box: string; dot: string; title: string }> = {
  quiet: { box: 'border-emerald-400 bg-emerald-400/10', dot: 'bg-emerald-400', title: 'text-emerald-300' },
  watch: { box: 'border-amber-400 bg-amber-400/10', dot: 'bg-amber-400', title: 'text-amber-300' },
  big: { box: 'border-rose-400 bg-rose-400/10', dot: 'bg-rose-400', title: 'text-rose-300' },
};

/** The insight, one paragraph per line: a takeaway, then one line per coin. Used by InsightBody. */
function InsightText({ text }: { text: string }) {
  return (
    <div className="space-y-1 text-base leading-relaxed text-slate-100">
      {text.split('\n').map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  );
}

/**
 * Today's verdict and advice, worked out by rules from the price moves (not by the AI), so it is
 * consistent and never guesses what happens next. Used by InsightBody.
 */
function VerdictBox({ verdict }: { verdict: Verdict }) {
  const style = VERDICT_STYLE[verdict.level];
  return (
    <div className={`rounded-lg border-l-2 px-3 py-2 ${style.box}`}>
      <p className={`flex items-center gap-2 text-sm font-semibold ${style.title}`}>
        <span aria-hidden className={`h-2 w-2 rounded-full ${style.dot}`} />
        Today: {verdict.title}
      </p>
      <p className="text-sm text-slate-200">{verdict.advice}</p>
    </div>
  );
}

/** The insight text, today's verdict, who wrote it (model or rule-based), and thumbs. Rendered by InsightSection. */
function InsightBody({ insight, verdict }: { insight: Insight; verdict: Verdict | null }) {
  const voting = useVote({ section: 'INSIGHT', itemId: insight.id, content: { text: insight.text, model: insight.model } }, insight.myVote);
  return (
    <div className="flex flex-1 flex-col justify-between gap-4">
      <div className="space-y-3">
        <InsightText text={insight.text} />
        {verdict && <VerdictBox verdict={verdict} />}
      </div>
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
 * The AI Insight of the Day card, written for this user's coins and investor type, with a
 * rule-based verdict under it. Data from GET /api/dashboard/insight (useInsight). Rendered by DashboardPage, always first.
 */
export function InsightSection(props: SectionProps) {
  const query = useInsight();
  return (
    <SectionCard title="AI Insight of the Day" query={query} {...props}>
      {({ insight, verdict }) => <InsightBody insight={insight} verdict={verdict} />}
    </SectionCard>
  );
}
