import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsSlow } from './useIsSlow';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useIsSlow', () => {
  it('turns true only after the request has been pending for the delay', () => {
    const { result } = renderHook(({ active }) => useIsSlow(active, 3000), { initialProps: { active: true } });
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(2999));
    expect(result.current).toBe(false);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });

  it('resets when the request finishes, and never fires for a fast one', () => {
    const { result, rerender } = renderHook(({ active }) => useIsSlow(active, 3000), { initialProps: { active: true } });
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current).toBe(true);

    rerender({ active: false });
    expect(result.current).toBe(false);

    // A second, fast request: done after 1 s, so no hint, even once the old delay has passed.
    rerender({ active: true });
    act(() => vi.advanceTimersByTime(1000));
    rerender({ active: false });
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(false);
  });
});
