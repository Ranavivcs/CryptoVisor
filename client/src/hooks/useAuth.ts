import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth';

/** Cache key for the signed-in user. Login/logout write to it directly instead of refetching. */
export const ME_KEY = ['me'] as const;

/** The signed-in user (`null` if signed out). Fetched once, then served from the query cache. */
export function useMe() {
  return useQuery({ queryKey: ME_KEY, queryFn: authApi.fetchMe, staleTime: Infinity, retry: false });
}

/** Login mutation. On success the user lands in the cache, so guards re-render immediately. */
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => queryClient.setQueryData(ME_KEY, user),
  });
}

/** Signup mutation. Same cache update as login: the server signs new users in. */
export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (user) => queryClient.setQueryData(ME_KEY, user),
  });
}

/**
 * Forgets the signed-in user: the route guard redirects to /login, then every other cached
 * query is dropped so the next user can't see this user's data.
 *
 * Order matters. Writing `null` into the existing "me" query is what the mounted guard is
 * subscribed to; `queryClient.clear()` would delete that query out from under the guard,
 * which then never sees the sign-out (the bug we had: a dashboard full of "Not signed in").
 */
export function signOutLocally(queryClient: QueryClient) {
  queryClient.setQueryData(ME_KEY, null);
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== ME_KEY[0] });
}

/** Logout mutation: clears the cookie on the server, then the session in the client. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => signOutLocally(queryClient),
  });
}
