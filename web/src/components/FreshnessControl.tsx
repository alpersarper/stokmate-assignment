import { describeFreshness, type Locale } from '@stokmate/shared';
import { RefreshCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { useNowTick } from '@/lib/refresh';

const LOCALE_TAGS: Record<Locale, string> = { en: 'en-US', tr: 'tr-TR' };

function clockTime(timestamp: number, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], { timeStyle: 'short' }).format(
    new Date(timestamp),
  );
}

/**
 * Toolbar freshness cluster (data-freshness feature): "when was the visible
 * dataset successfully fetched" + the protected Refresh action. The label is
 * driven by TanStack's dataUpdatedAt, so a failed refresh never moves it —
 * failure keeps the old data and states which snapshot is being shown.
 * Visually secondary by design: small muted text next to the data surface.
 */
export function FreshnessControl({
  dataUpdatedAt,
  errorUpdatedAt,
  isFetching,
  onRefresh,
  refreshDisabled,
}: {
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  isFetching: boolean;
  onRefresh: () => void;
  refreshDisabled: boolean;
}) {
  const { t, locale } = useI18n();
  const now = useNowTick();

  const lastAttemptFailed = errorUpdatedAt > dataUpdatedAt;

  let label: string;
  let failed = false;
  if (isFetching) {
    label = t('updating');
  } else if (lastAttemptFailed) {
    failed = true;
    label =
      dataUpdatedAt > 0
        ? t('refreshFailedShowing', { time: clockTime(dataUpdatedAt, locale) })
        : t('refreshFailed');
  } else if (dataUpdatedAt > 0) {
    const freshness = describeFreshness(dataUpdatedAt, now);
    label =
      freshness.kind === 'justNow'
        ? t('updatedJustNow')
        : freshness.kind === 'seconds'
          ? t('updatedSecondsAgo', { count: freshness.seconds })
          : freshness.kind === 'minutes'
            ? t('updatedMinutesAgo', { count: freshness.minutes })
            : t('updatedAtTime', { time: clockTime(dataUpdatedAt, locale) });
  } else {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      <span
        role="status"
        className={`text-xs whitespace-nowrap ${failed ? 'text-destructive' : 'text-muted-foreground'}`}
      >
        {label}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground"
        aria-label={t('refreshDataLabel')}
        onClick={onRefresh}
        disabled={refreshDisabled}
      >
        <RefreshCwIcon className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
        {t('refreshData')}
      </Button>
    </div>
  );
}
