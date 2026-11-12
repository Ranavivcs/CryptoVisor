import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

/** Logout mutation. Clears every cached query so the next user starts clean. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(ME_KEY, null);
    },
  });
}
