import { usePrices } from '../../hooks/useDashboard';
import { formatPct, formatUsd } from '../../lib/format';
import { SectionCard } from './SectionCard';
import { Sparkline } from './Sparkline';
import { VoteButtons } from './VoteButtons';

/** Live prices for the user's coins with 24h change and a 7-day sparkline. Refreshes every minute. */
export function PricesSection({ className }: { className?: string }) {
  const query = usePrices();
  return (
    <SectionCard title="Coin Prices" icon="📈" query={query} className={className}>
      {({ coins }) => (
        <ul className="divide-y divide-slate-800">
          {coins.map((coin) => {
            const up = coin.change24hPct >= 0;
            return (
              <li key={coin.id} className="flex items-center gap-3 py-3">
                <img src={coin.image} alt="" className="h-8 w-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{coin.symbol}</p>
                  <p className="truncate text-xs text-slate-400">{coin.name}</p>
                </div>
                {/* The sparkline is a nice-to-have, so it's the first thing to go on narrow phones. */}
                <div className="hidden sm:block">
                  <Sparkline values={coin.sparkline} positive={(coin.sparkline.at(-1) ?? 0) >= (coin.sparkline[0] ?? 0)} />
                </div>
                <div className="w-24 text-right">
                  <p className="font-medium tabular-nums">{formatUsd(coin.priceUsd)}</p>
                  <p className={`text-xs tabular-nums ${up ? 'text-emerald-400' : 'text-rose-400'}`}>{formatPct(coin.change24hPct)} 24h</p>
                </div>
                <VoteButtons
                  section="PRICES"
                  itemId={coin.id}
                  initialVote={coin.myVote}
                  label={coin.name}
                  content={{ symbol: coin.symbol, priceUsd: coin.priceUsd, change24hPct: coin.change24hPct }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
