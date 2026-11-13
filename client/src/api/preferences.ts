import { apiFetch } from './client';

export type InvestorType = 'HODLER' | 'DAY_TRADER' | 'NFT_COLLECTOR' | 'DEFI_EXPLORER' | 'NEWCOMER';
export type ContentType = 'MARKET_NEWS' | 'CHARTS' | 'SOCIAL' | 'FUN';

export interface Coin {
  id: string;
  symbol: string;
  name: string;
}

export interface Choice<T extends string> {
  value: T;
  label: string;
  description: string;
}

/** The quiz's answer choices, served by the API so they're defined in one place. */
export interface PreferenceOptions {
  coins: Coin[];
  investorTypes: Choice<InvestorType>[];
  contentTypes: Choice<ContentType>[];
}

export interface PreferencesInput {
  assets: string[];
  investorType: InvestorType;
  contentTypes: ContentType[];
}

export interface Preferences extends PreferencesInput {
  updatedAt: string;
}

/** GET /api/preferences/options: the quiz choices. Used by usePreferenceOptions. */
export function fetchPreferenceOptions(): Promise<PreferenceOptions> {
  return apiFetch<PreferenceOptions>('/preferences/options');
}

/** GET /api/preferences: the saved answers, or null before onboarding. Used by usePreferences. */
export async function fetchPreferences(): Promise<Preferences | null> {
  const { preferences } = await apiFetch<{ preferences: Preferences | null }>('/preferences');
  return preferences;
}

/** PUT /api/preferences: saves all quiz answers at once. Used by useSavePreferences. */
export async function savePreferences(input: PreferencesInput): Promise<Preferences> {
  const { preferences } = await apiFetch<{ preferences: Preferences }>('/preferences', { method: 'PUT', body: input });
  return preferences;
}
