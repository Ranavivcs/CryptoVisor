import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import { signOutLocally } from '../hooks/useAuth';

/**
 * The app's React Query client. Any request that comes back 401 (the session expired, or the
 * cookie was cleared) signs the user out locally, so the guard sends them to /login instead of
 * leaving every card showing "Not signed in". Created once in main.tsx.
 */
export function createQueryClient() {
  const handleError = (error: Error) => {
    if (error instanceof ApiError && error.status === 401) signOutLocally(queryClient);
  };
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        // A 401 won't fix itself on retry. Other errors (a server waking up, a rate-limited price API)
        // usually clear within seconds: 5 retries with the default backoff (1, 2, 4, 8, 16s) keep the
        // loading skeleton up for about 30s before showing an error.
        retry: (failureCount, error) => !(error instanceof ApiError && error.status === 401) && failureCount < 5,
      },
    },
  });
  return queryClient;
}
