import type { ComponentType } from 'react';
import { Link } from 'react-router';
import { InsightSection } from '../components/dashboard/InsightSection';
import { MemeSection } from '../components/dashboard/MemeSection';
import { NewsSection } from '../components/dashboard/NewsSection';
import { PricesSection } from '../components/dashboard/PricesSection';
import { Button } from '../components/ui/Button';
import { useLogout, useMe } from '../hooks/useAuth';
import { usePreferences } from '../hooks/usePreferences';
import { useToday } from '../hooks/useToday';
import { formatDay } from '../lib/format';
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
  // The same date the insight is keyed on, so the date line and the insight switch together at midnight.
  const today = useToday();
  const order = sectionOrder(preferences?.contentTypes ?? []);

  return (
    // Desktop: the page is exactly one screen tall and each card scrolls inside itself.
    // Phones: a normal scrolling page, one card per row.
    <main className="mx-auto flex max-w-7xl flex-col px-4 py-6 lg:h-dvh">
      <header className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {greeting()}, <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">{user?.name}</span>
          </h1>
          <p className="text-sm text-slate-400">
            Your crypto briefing for {formatDay(today)}
          </p>
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

      {/*
        grid-cols-1 = minmax(0, 1fr): without it, a wide meme image stretches the column past the screen.
        Desktop: the insight is a full-width strip (auto height), the other three share the rest of the screen.
      */}
      <div className="grid grid-cols-1 gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-[auto_minmax(0,1fr)]">
        {order.map((name, index) => {
          const Section = SECTIONS[name];
          return <Section key={name} className={index === 0 ? 'lg:col-span-3' : 'max-h-[36rem] lg:max-h-none'} />;
        })}
      </div>

      <p className="mt-4 shrink-0 text-center text-xs text-slate-500">
        Your votes are saved to improve future recommendations. Nothing here is financial advice.
      </p>
    </main>
  );
}
