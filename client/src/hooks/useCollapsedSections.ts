import { useCallback, useEffect, useState } from 'react';
import type { DashboardSection } from '../lib/sectionOrder';

const storageKey = (userId: string) => `collapsed-sections:${userId}`;

/** The saved set for this user; empty (everything open) when nothing is saved or storage is blocked. Used by the hook below. */
function load(userId: string | undefined): Set<DashboardSection> {
  if (!userId) return new Set();
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey(userId)) ?? '[]');
    return new Set(Array.isArray(saved) ? (saved as DashboardSection[]) : []);
  } catch {
    return new Set();
  }
}

/**
 * Which dashboard sections this user folded away. Everything starts open; the choice is a
 * per-browser convenience kept in localStorage, keyed by user, so a shared computer doesn't mix
 * two people's layouts. Used by DashboardPage.
 */
export function useCollapsedSections(userId: string | undefined) {
  const [collapsed, setCollapsed] = useState(() => load(userId));

  // useMe can resolve after the first render: load this user's choice once their id is known.
  useEffect(() => setCollapsed(load(userId)), [userId]);

  const toggle = useCallback(
    (section: DashboardSection) =>
      setCollapsed((current) => {
        const next = new Set(current);
        if (!next.delete(section)) next.add(section);
        if (userId) {
          try {
            localStorage.setItem(storageKey(userId), JSON.stringify([...next]));
          } catch {
            // Storage blocked (private mode): the choice just lasts for this visit.
          }
        }
        return next;
      }),
    [userId],
  );

  return { collapsed, toggle };
}
