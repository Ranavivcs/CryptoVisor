import { useId, useState } from 'react';
import type { CoinMarket } from '../../api/dashboard';
import { usePrices } from '../../hooks/useDashboard';
import { useVote } from '../../hooks/useVote';
import { formatPct, formatTime, formatUsd } from '../../lib/format';
import { PriceChart } from './PriceChart';
import { SectionCard } from './SectionCard';
import { Sparkline } from './Sparkline';
import { VoteButtons } from './VoteButtons';

/**
 * One coin: logo, name, 7-day sparkline, price, 24h change and thumbs. Clicking the row opens a
 * larger 7-day chart under it. The thumbs sit outside the toggle button (buttons can't nest).
 */
function CoinRow({ coin }: { coin: CoinMarket }) {
  const voting = useVote(
    { section: 'PRICES', itemId: coin.id, content: { symbol: coin.symbol, priceUsd: coin.priceUsd, change24hPct: coin.change24hPct } },
    coin.myVote,
  );
  const [expanded, setExpanded] = useState(false);
  const chartId = useId();
  const up = coin.change24hPct >= 0;
  const canChart = coin.sparkline.length >= 2 && Boolean(coin.lastUpdated);

  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          disabled={!canChart}
          aria-expanded={expanded}
          aria-controls={chartId}
          aria-label={`${coin.name}: ${expanded ? 'hide' : 'show'} the 7-day chart`}
          className="-mx-2 flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1 text-left hover:bg-slate-800/60 disabled:cursor-default disabled:hover:bg-transparent"
        >
          <img src={coin.image} alt="" className="h-8 w-8 shrink-0 rounded-full" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{coin.symbol}</span>
            <span className="block truncate text-xs text-slate-400">{coin.name}</span>
          </span>
          {/* The sparkline is a nice-to-have, so it's the first thing to go when the card is narrow
              (a phone, or a column of the 3-column desktop layout). The expanded chart replaces it there. */}
          <span className="hidden @md:block">
            <Sparkline values={coin.sparkline} positive={(coin.sparkline.at(-1) ?? 0) >= (coin.sparkline[0] ?? 0)} />
          </span>
          <span className="w-24 text-right">
            <span className="block font-medium tabular-nums">{formatUsd(coin.priceUsd)}</span>
            <span className={`block text-xs tabular-nums ${up ? 'text-emerald-400' : 'text-rose-400'}`}>{formatPct(coin.change24hPct)} 24h</span>
            {/* Guarded: during a deploy the new client can briefly talk to the old API, which doesn't send it. */}
            {coin.lastUpdated && <span className="block text-[11px] text-slate-500 tabular-nums">as of {formatTime(coin.lastUpdated)}</span>}
          </span>
          {canChart && (
            <svg aria-hidden viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 fill-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>
              <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
            </svg>
          )}
        </button>
        <VoteButtons {...voting} label={coin.name} />
      </div>
      {expanded && (
        <div id={chartId} className="mt-2">
          <PriceChart values={coin.sparkline} endTime={coin.lastUpdated} label={coin.name} />
        </div>
      )}
    </li>
  );
}

function CoinList({ heading, coins }: { heading: string; coins: CoinMarket[] }) {
  if (coins.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</h3>
      <ul className="divide-y divide-slate-800">
        {coins.map((coin) => (
          <CoinRow key={coin.id} coin={coin} />
        ))}
      </ul>
    </div>
  );
}

/**
 * The user's coins, then the biggest 24h moves among coins they don't follow. Refreshes every minute.
 * Crypto trades 24/7, so there are no market hours: "24h" is a rolling window, not a calendar day.
 */
export function PricesSection({ className }: { className?: string }) {
  const query = usePrices();
  return (
    <SectionCard title="Coin Prices" query={query} className={className}>
      {({ coins, movers }) => (
        <div className="space-y-4">
          <CoinList heading="Your coins" coins={coins} />
          <CoinList heading="Biggest moves (24h)" coins={movers} />
        </div>
      )}
    </SectionCard>
  );
}
