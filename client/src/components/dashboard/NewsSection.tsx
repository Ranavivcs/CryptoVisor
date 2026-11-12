import type { NewsItem } from '../../api/dashboard';
import { useNews } from '../../hooks/useDashboard';
import { useVote } from '../../hooks/useVote';
import { timeAgo } from '../../lib/format';
import { SectionCard } from './SectionCard';
import { VoteButtons } from './VoteButtons';

/**
 * One headline. A 👎 collapses it right away with an Undo; the server also leaves it out
 * of this user's feed from then on.
 */
function NewsRow({ item }: { item: NewsItem }) {
  const voting = useVote(
    { section: 'NEWS', itemId: item.id, content: { title: item.title, url: item.url, sourceName: item.sourceName, coins: item.coins } },
    item.myVote,
  );

  if (voting.vote === -1) {
    return (
      <li className="flex items-center justify-between gap-3 py-3 text-sm text-slate-400">
        <span>Got it. You&apos;ll see fewer stories like this.</span>
        {/* Clicking 👎 again removes the vote, which brings the story back. */}
        <button type="button" onClick={() => voting.cast(-1)} className="font-medium text-amber-400 hover:underline">
          Undo
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-amber-300 hover:underline">
          {item.title}
        </a>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
          <span>{item.sourceName}</span>
          {item.publishedAt && <span>· {timeAgo(item.publishedAt)}</span>}
          {item.coins.map((coin) => (
            <span key={coin} className="rounded bg-slate-800 px-1.5 py-0.5 font-semibold text-amber-300">
              {coin}
            </span>
          ))}
        </p>
      </div>
      <VoteButtons {...voting} label={item.title} />
    </li>
  );
}

/** Headlines about the user's coins first, then general market news. */
export function NewsSection({ className }: { className?: string }) {
  const query = useNews();
  return (
    <SectionCard title="Market News" query={query} className={className}>
      {({ items }) =>
        items.length === 0 ? (
          <p className="text-sm text-slate-400">No news for your coins right now.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {items.map((item) => (
              <NewsRow key={item.id} item={item} />
            ))}
          </ul>
        )
      }
    </SectionCard>
  );
}
