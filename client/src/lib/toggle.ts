/** Returns a new array with `value` added if it was missing, or removed if it was there. Used by the multi-select quiz steps. */
export function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
