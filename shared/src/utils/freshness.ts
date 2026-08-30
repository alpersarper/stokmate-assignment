/**
 * Data-freshness descriptor shared by web and mobile so both surfaces bucket
 * "how old is the visible dataset" identically. The input is TanStack Query's
 * `dataUpdatedAt` — the time of the last SUCCESSFUL fetch — so a failed
 * refresh never moves the indicator. Rendering (message catalogs, clock-time
 * formatting) stays per-app; this only decides which message applies.
 */

/** Ages below this read as "updated just now". */
export const FRESHNESS_JUST_NOW_MS = 10_000;
/** Ages below one minute are shown in seconds, above in minutes… */
const MINUTE_MS = 60_000;
/** …and beyond one hour the exact clock time is more useful than "73 min ago". */
const HOUR_MS = 3_600_000;

export type FreshnessDescriptor =
  | { kind: 'justNow' }
  | { kind: 'seconds'; seconds: number }
  | { kind: 'minutes'; minutes: number }
  | { kind: 'clock' };

export function describeFreshness(updatedAtMs: number, nowMs: number): FreshnessDescriptor {
  const age = Math.max(0, nowMs - updatedAtMs);
  if (age < FRESHNESS_JUST_NOW_MS) return { kind: 'justNow' };
  if (age < MINUTE_MS) return { kind: 'seconds', seconds: Math.floor(age / 1000) };
  if (age < HOUR_MS) return { kind: 'minutes', minutes: Math.floor(age / MINUTE_MS) };
  return { kind: 'clock' };
}
