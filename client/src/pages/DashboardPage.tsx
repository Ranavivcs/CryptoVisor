import type { ComponentType } from 'react';
import { Link } from 'react-router';
import { InsightSection } from '../components/dashboard/InsightSection';
import { MemeSection } from '../components/dashboard/MemeSection';
import { NewsSection } from '../components/dashboard/NewsSection';
import { PricesSection } from '../components/dashboard/PricesSection';
import { Button } from '../components/ui/Button';
import { useLogout, useMe } from '../hooks/useAuth';
import { usePreferences } from '../hooks/usePreferences';
import { sectionOrder, type DashboardSection } from '../lib/sectionOrder';

const SECTIONS: Record<DashboardSection, ComponentType<{ className?: string }>> = {
  insight: InsightSection,
  prices: PricesSection,
  news: NewsSection,
  meme: MemeSection,
};

function greeting(hour = new Date().getHours()): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * The daily dashboard. Each section fetches its own data, so a slow or failing source
 * affects one card, not the page. The order follows the user's content preferences.
 */
export function DashboardPage() {
  const { data: user } = useMe();
  const { data: preferences } = usePreferences();
  const logoutMutation = useLogout();
  const order = sectionOrder(preferences?.contentTypes ?? []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting()}, {user?.name}
          </h1>
          <p className="text-slate-400">Your crypto briefing for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <nav className="flex items-center gap-2">
          <Link to="/onboarding" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
            Edit preferences
          </Link>
          <Button variant="ghost" loading={logoutMutation.isPending} onClick={() => logoutMutation.mutate()}>
            Log out
          </Button>
        </nav>
      </header>

      {/* grid-cols-1 = minmax(0, 1fr): without it, a wide meme image stretches the column past the screen. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {order.map((name, index) => {
          const Section = SECTIONS[name];
          return <Section key={name} className={index === 0 ? 'lg:col-span-2' : ''} />;
        })}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        Your 👍/👎 are saved to improve future recommendations. Nothing here is financial advice.
      </p>
    </main>
  );
}
