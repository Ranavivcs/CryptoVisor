/**
 * Every provider says where its data came from, so the UI can be honest
 * ("live" vs "sample data, the live feed is unavailable").
 */
export type DataSource = 'live' | 'fallback';

export interface Sourced<T> {
  source: DataSource;
  data: T;
}
