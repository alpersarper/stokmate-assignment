import { describe, expect, it } from 'vitest';
import { describeFreshness } from '../utils/freshness';

const T0 = 1_756_600_000_000;

describe('describeFreshness', () => {
  it('reads as "just now" under 10 seconds', () => {
    expect(describeFreshness(T0, T0)).toEqual({ kind: 'justNow' });
    expect(describeFreshness(T0, T0 + 9_999)).toEqual({ kind: 'justNow' });
  });

  it('buckets 10s–59s into whole seconds', () => {
    expect(describeFreshness(T0, T0 + 10_000)).toEqual({ kind: 'seconds', seconds: 10 });
    expect(describeFreshness(T0, T0 + 24_400)).toEqual({ kind: 'seconds', seconds: 24 });
    expect(describeFreshness(T0, T0 + 59_999)).toEqual({ kind: 'seconds', seconds: 59 });
  });

  it('buckets 1min–59min into whole minutes', () => {
    expect(describeFreshness(T0, T0 + 60_000)).toEqual({ kind: 'minutes', minutes: 1 });
    expect(describeFreshness(T0, T0 + 3 * 60_000 + 30_000)).toEqual({ kind: 'minutes', minutes: 3 });
    expect(describeFreshness(T0, T0 + 3_599_999)).toEqual({ kind: 'minutes', minutes: 59 });
  });

  it('falls back to the exact clock time from one hour', () => {
    expect(describeFreshness(T0, T0 + 3_600_000)).toEqual({ kind: 'clock' });
    expect(describeFreshness(T0, T0 + 26 * 3_600_000)).toEqual({ kind: 'clock' });
  });

  it('clamps clock skew (updatedAt in the future) to "just now"', () => {
    expect(describeFreshness(T0 + 5_000, T0)).toEqual({ kind: 'justNow' });
  });
});
