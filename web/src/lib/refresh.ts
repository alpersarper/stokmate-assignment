import { focusManager } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

/**
 * The one refresh pipeline (data-freshness feature, DECISIONS §13): every
 * mechanism that can refresh a query — manual button, anchored background
 * poll, TanStack focus/reconnect revalidation, mutation invalidation — ends
 * in a fetch on the same query key, and `cancelRefetch: false` makes any
 * overlap JOIN the in-flight request instead of starting a second one.
 * Single-flight and request dedup are therefore structural, not policed.
 */
interface RefreshableQuery {
  /** Referentially stable in TanStack Query v5. */
  refetch: (options?: { cancelRefetch?: boolean }) => Promise<unknown>;
  isFetching: boolean;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
}

/** Cooldown after a manual refresh settles before another may start. */
export const MANUAL_REFRESH_COOLDOWN_MS = 4_000;

/**
 * Background polling anchored to the last fetch SETTLE (success or failure),
 * whatever triggered that fetch. Unlike `refetchInterval`'s free-running
 * timer, a manual/focus/mutation refetch pushes the next automatic poll a
 * full interval out — overlapping freshness mechanisms can never stack.
 * Pauses while the tab is hidden (same focusManager gate refetchInterval
 * used); on return, TanStack's own focus revalidation covers catch-up and
 * any simultaneous timer fire joins its request.
 */
export function useAnchoredRefetch(query: RefreshableQuery, intervalMs: number): void {
  const { refetch, dataUpdatedAt, errorUpdatedAt } = query;

  const [focused, setFocused] = useState(() => focusManager.isFocused());
  useEffect(() => focusManager.subscribe(setFocused), []);

  // 0 until the first fetch settles — nothing to re-anchor to while the
  // initial load is still in flight.
  const anchor = Math.max(dataUpdatedAt, errorUpdatedAt);

  useEffect(() => {
    if (!focused || anchor === 0) return;
    const timer = setTimeout(
      () => void refetch({ cancelRefetch: false }),
      Math.max(0, anchor + intervalMs - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [focused, anchor, intervalMs, refetch]);
}

/**
 * Manual-refresh guard: ignores triggers while a fetch is in flight (layer 1)
 * and for a short cooldown after the previous manual refresh settles
 * (layer 2). Returns the settle promise when a refresh actually started
 * (null when the trigger was ignored) so callers driving native affordances
 * can reflect it. Even the narrow window where `isFetching` is stale in the
 * closure is safe: the joined refetch reuses the in-flight request.
 */
export function useManualRefresh(
  query: RefreshableQuery,
  cooldownMs: number = MANUAL_REFRESH_COOLDOWN_MS,
): { refresh: () => Promise<unknown> | null; refreshDisabled: boolean } {
  const { refetch, isFetching } = query;
  const [coolingDown, setCoolingDown] = useState(false);

  const refresh = useCallback(() => {
    if (isFetching || coolingDown) return null;
    return refetch({ cancelRefetch: false }).finally(() => setCoolingDown(true));
  }, [refetch, isFetching, coolingDown]);

  useEffect(() => {
    if (!coolingDown) return;
    const timer = setTimeout(() => setCoolingDown(false), cooldownMs);
    return () => clearTimeout(timer);
  }, [coolingDown, cooldownMs]);

  return { refresh, refreshDisabled: isFetching || coolingDown };
}

/**
 * Re-render tick so a relative freshness label ("24 sec ago") stays current.
 */
export function useNowTick(intervalMs = 5_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
