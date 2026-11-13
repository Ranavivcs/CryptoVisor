import type { CoinMarket } from '../../api/dashboard';
import { usePrices } from '../../hooks/useDashboard';
import { CoinRow } from './CoinRow';
import { SectionCard } from './SectionCard';

/** A titled list of coin rows; renders nothing when the list is empty. Used twice by PricesSection. */
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
 * The Coin Prices card: the user's coins, then the biggest 24h moves among coins they don't follow.
 * Data from GET /api/dashboard/prices (usePrices), refreshed every minute. Crypto trades 24/7, so
 * there are no market hours: "24h" is a rolling window, not a calendar day.
 * Rendered by DashboardPage, in the user's preferred section order.
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
