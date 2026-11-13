import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '../api/auth';
import * as preferencesApi from '../api/preferences';
import { ME_KEY } from './useAuth';

export const PREFERENCES_KEY = ['preferences'] as const;

/** The quiz choices. They never change while the app is open, so they're fetched once. Used by OnboardingPage. */
export function usePreferenceOptions() {
  return useQuery({
    queryKey: ['preferences', 'options'],
    queryFn: preferencesApi.fetchPreferenceOptions,
    staleTime: Infinity,
  });
}

/** The user's saved answers (null before onboarding). Used by DashboardPage (section order) and OnboardingPage (pre-fill). */
export function usePreferences() {
  return useQuery({ queryKey: PREFERENCES_KEY, queryFn: preferencesApi.fetchPreferences });
}

/**
 * Saves the quiz answers. On success it updates the cache in place: the saved preferences,
 * and `hasPreferences` on the current user, so the route guard lets them into the dashboard.
 * It also marks every dashboard section stale, so changed coins show up right away
 * (news is otherwise cached for 5 minutes). Used by Quiz.
 */
export function useSavePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: preferencesApi.savePreferences,
    onSuccess: (preferences) => {
      queryClient.setQueryData(PREFERENCES_KEY, preferences);
      queryClient.setQueryData<User | null>(ME_KEY, (user) => (user ? { ...user, hasPreferences: true } : user));
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
