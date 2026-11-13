import type { CoinMarket } from '../../api/dashboard';
import { usePrices } from '../../hooks/useDashboard';
import { useVote } from '../../hooks/useVote';
import { formatPct, formatTime, formatUsd } from '../../lib/format';
import { SectionCard } from './SectionCard';
import { Sparkline } from './Sparkline';
import { VoteButtons } from './VoteButtons';

/** One coin: logo, name, 7-day sparkline, price, 24h change and thumbs. */
function CoinRow({ coin }: { coin: CoinMarket }) {
  const voting = useVote(
    { section: 'PRICES', itemId: coin.id, content: { symbol: coin.symbol, priceUsd: coin.priceUsd, change24hPct: coin.change24hPct } },
    coin.myVote,
  );
  const up = coin.change24hPct >= 0;
  return (
    <li className="flex items-center gap-3 py-3">
      <img src={coin.image} alt="" className="h-8 w-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{coin.symbol}</p>
        <p className="truncate text-xs text-slate-400">{coin.name}</p>
      </div>
      {/* The sparkline is a nice-to-have, so it's the first thing to go when the card is narrow
          (a phone, or a column of the 3-column desktop layout). */}
      <div className="hidden @md:block">
        <Sparkline values={coin.sparkline} positive={(coin.sparkline.at(-1) ?? 0) >= (coin.sparkline[0] ?? 0)} />
      </div>
      <div className="w-24 text-right">
        <p className="font-medium tabular-nums">{formatUsd(coin.priceUsd)}</p>
        <p className={`text-xs tabular-nums ${up ? 'text-emerald-400' : 'text-rose-400'}`}>{formatPct(coin.change24hPct)} 24h</p>
        <p className="text-[11px] text-slate-500 tabular-nums">as of {formatTime(coin.lastUpdated)}</p>
      </div>
      <VoteButtons {...voting} label={coin.name} />
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
