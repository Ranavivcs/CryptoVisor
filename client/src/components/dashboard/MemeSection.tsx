import { useState } from 'react';
import type { Meme } from '../../api/dashboard';
import { useMeme } from '../../hooks/useDashboard';
import { useVote } from '../../hooks/useVote';
import { SectionCard } from './SectionCard';
import { VoteButtons } from './VoteButtons';

/** Reddit images sometimes fail to load (deleted posts, blocked hotlinks); try this many replacements. */
const MAX_IMAGE_RETRIES = 3;

interface MemeBodyProps {
  meme: Meme;
  onDisliked: () => void;
  onImageError: () => void;
}

function MemeBody({ meme, onDisliked, onImageError }: MemeBodyProps) {
  const voting = useVote(
    { section: 'MEME', itemId: meme.id, content: { title: meme.title, imageUrl: meme.imageUrl, text: meme.text } },
    meme.myVote,
    (vote) => vote === -1 && onDisliked(),
  );
  return (
    <figure className="flex min-h-0 flex-1 flex-col gap-3">
      {meme.imageUrl ? (
        <img
          src={meme.imageUrl}
          alt={meme.title}
          onError={onImageError}
          className="min-h-0 w-full flex-1 rounded-lg bg-slate-950 object-contain"
        />
      ) : (
        <blockquote className="flex flex-1 items-center whitespace-pre-line rounded-lg bg-gradient-to-br from-amber-400/15 to-fuchsia-500/10 p-6 text-lg">
          {meme.text}
        </blockquote>
      )}
      <figcaption className="flex shrink-0 items-center justify-between gap-2 text-sm text-slate-400">
        {meme.postUrl ? (
          <a href={meme.postUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
            {meme.title}
          </a>
        ) : (
          <span className="truncate">{meme.title}</span>
        )}
        <VoteButtons {...voting} label="this meme" />
      </figcaption>
    </figure>
  );
}

/**
 * A random crypto meme, new on every visit. A 👎 swaps it for another one right away, and the
 * server never shows that meme to this user again. If an image fails to load, another meme is
 * fetched automatically (a few times at most, so a Reddit outage can't cause an endless loop).
 */
export function MemeSection({ className }: { className?: string }) {
  const query = useMeme();
  const [imageFailures, setImageFailures] = useState(0);

  function nextMeme() {
    setImageFailures(0);
    query.refetch();
  }

  function handleImageError() {
    setImageFailures((failures) => failures + 1);
    if (imageFailures + 1 < MAX_IMAGE_RETRIES) query.refetch();
  }

  const anotherOne = (
    <button
      type="button"
      onClick={nextMeme}
      disabled={query.isFetching}
      className="rounded-lg border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800 disabled:opacity-50"
    >
      {query.isFetching ? 'Loading…' : 'Another one'}
    </button>
  );

  return (
    <SectionCard title="Memes" query={query} actions={anotherOne} className={className}>
      {({ meme }) =>
        imageFailures >= MAX_IMAGE_RETRIES ? (
          <p className="text-sm text-slate-400">Couldn&apos;t load a meme image right now. Try &quot;Another one&quot; in a bit.</p>
        ) : (
          // key: a new meme gets fresh vote state instead of inheriting the previous meme's thumb.
          <MemeBody key={meme.id} meme={meme} onDisliked={nextMeme} onImageError={handleImageError} />
        )
      }
    </SectionCard>
  );
}
