import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCollapsedSections } from './useCollapsedSections';

beforeEach(() => localStorage.clear());

describe('useCollapsedSections', () => {
  it('starts with everything open, and remembers what this user collapsed', () => {
    const first = renderHook(() => useCollapsedSections('user-1'));
    expect(first.result.current.collapsed.size).toBe(0);

    act(() => first.result.current.toggle('meme'));
    expect(first.result.current.collapsed.has('meme')).toBe(true);

    // A later visit by the same user keeps it; another user on this browser starts fresh.
    expect(renderHook(() => useCollapsedSections('user-1')).result.current.collapsed.has('meme')).toBe(true);
    expect(renderHook(() => useCollapsedSections('user-2')).result.current.collapsed.size).toBe(0);

    act(() => first.result.current.toggle('meme'));
    expect(first.result.current.collapsed.has('meme')).toBe(false);
  });
});
