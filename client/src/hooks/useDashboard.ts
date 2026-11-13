import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '../api/dashboard';
import { userTimeZone, useToday } from './useToday';

const ONE_MINUTE = 60_000;

/**
 * Prices refresh every minute while the tab is visible. CoinGecko's free API has no push/stream,
 * so a timed refetch is the honest way to keep prices current (and the server caches for 60s). Used by PricesSection.
 */
export function usePrices() {
  return useQuery({ queryKey: ['dashboard', 'prices'], queryFn: dashboardApi.fetchPrices, refetchInterval: ONE_MINUTE });
}

/** News: cached for 5 minutes on the client (the server caches the feeds for 10). Used by NewsSection. */
export function useNews() {
  return useQuery({ queryKey: ['dashboard', 'news'], queryFn: dashboardApi.fetchNews, staleTime: 5 * ONE_MINUTE });
}

/**
 * The insight changes once a day, so it's never refetched within a day. The date is part of
 * the query key: at local midnight the key changes and the new day's insight loads by itself. Used by InsightSection.
 */
export function useInsight() {
  const today = useToday();
  return useQuery({
    queryKey: ['dashboard', 'insight', today],
    queryFn: () => dashboardApi.fetchInsight(userTimeZone()),
    staleTime: Infinity,
  });
}

/** The meme is never "fresh": each dashboard visit (and the "Another one" button) gets a new one. Used by MemeSection. */
export function useMeme() {
  return useQuery({ queryKey: ['dashboard', 'meme'], queryFn: dashboardApi.fetchMeme, staleTime: 0 });
}
