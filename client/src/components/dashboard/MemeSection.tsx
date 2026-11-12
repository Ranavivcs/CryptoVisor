import { useMeme } from '../../hooks/useDashboard';
import { SectionCard } from './SectionCard';
import { VoteButtons } from './VoteButtons';

/** A random crypto meme, new on every visit. Voting one down means it won't be shown again. */
export function MemeSection({ className }: { className?: string }) {
  const query = useMeme();
  const anotherOne = (
    <button
      type="button"
      onClick={() => query.refetch()}
      disabled={query.isFetching}
      className="rounded-lg border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800 disabled:opacity-50"
    >
      {query.isFetching ? 'Loading…' : 'Another one'}
    </button>
  );

  return (
    <SectionCard title="Fun Crypto Meme" icon="😂" query={query} actions={anotherOne} className={className}>
      {({ meme }) => (
        <figure className="flex flex-1 flex-col gap-3">
          {meme.imageUrl ? (
            <img src={meme.imageUrl} alt={meme.title} className="max-h-96 w-full rounded-lg bg-slate-950 object-contain" />
          ) : (
            <blockquote className="flex flex-1 items-center whitespace-pre-line rounded-lg bg-gradient-to-br from-amber-400/15 to-fuchsia-500/10 p-6 text-lg">
              {meme.text}
            </blockquote>
          )}
          <figcaption className="flex items-center justify-between gap-2 text-sm text-slate-400">
            {meme.postUrl ? (
              <a href={meme.postUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                {meme.title}
              </a>
            ) : (
              <span className="truncate">{meme.title}</span>
            )}
            {/* key: a new meme gets fresh vote state instead of inheriting the previous meme's thumb. */}
            <VoteButtons
              key={meme.id}
              section="MEME"
              itemId={meme.id}
              initialVote={meme.myVote}
              label="this meme"
              content={{ title: meme.title, imageUrl: meme.imageUrl, text: meme.text }}
            />
          </figcaption>
        </figure>
      )}
    </SectionCard>
  );
}
