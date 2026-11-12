import { useQuery } from '@tanstack/react-query';
import * as dashboardApi from '../api/dashboard';

const ONE_MINUTE = 60_000;

/**
 * Prices refresh every minute while the tab is visible. CoinGecko's free API has no push/stream,
 * so a timed refetch is the honest way to keep prices current (and the server caches for 60s).
 */
export function usePrices() {
  return useQuery({ queryKey: ['dashboard', 'prices'], queryFn: dashboardApi.fetchPrices, refetchInterval: ONE_MINUTE });
}

/** News: cached for 5 minutes on the client (the server caches CryptoPanic for 10). */
export function useNews() {
  return useQuery({ queryKey: ['dashboard', 'news'], queryFn: dashboardApi.fetchNews, staleTime: 5 * ONE_MINUTE });
}

/** The insight changes once a day, so there's no reason to refetch it while the app is open. */
export function useInsight() {
  return useQuery({ queryKey: ['dashboard', 'insight'], queryFn: dashboardApi.fetchInsight, staleTime: Infinity });
}

/** The meme is never "fresh": each dashboard visit (and the "Another one" button) gets a new one. */
export function useMeme() {
  return useQuery({ queryKey: ['dashboard', 'meme'], queryFn: dashboardApi.fetchMeme, staleTime: 0 });
}
