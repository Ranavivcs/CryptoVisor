import { useNews } from '../../hooks/useDashboard';
import { timeAgo } from '../../lib/format';
import { SectionCard } from './SectionCard';
import { VoteButtons } from './VoteButtons';

/** Headlines about the user's coins (CryptoPanic, or built-in explainers as a fallback). */
export function NewsSection({ className }: { className?: string }) {
  const query = useNews();
  return (
    <SectionCard title="Market News" icon="📰" query={query} className={className}>
      {({ items }) =>
        items.length === 0 ? (
          <p className="text-sm text-slate-400">No news for your coins right now.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3">
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
                <VoteButtons
                  section="NEWS"
                  itemId={item.id}
                  initialVote={item.myVote}
                  label={item.title}
                  content={{ title: item.title, url: item.url, sourceName: item.sourceName, coins: item.coins }}
                />
              </li>
            ))}
          </ul>
        )
      }
    </SectionCard>
  );
}
