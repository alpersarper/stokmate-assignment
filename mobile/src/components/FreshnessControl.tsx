import { describeFreshness, type Locale } from '@stokmate/shared';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n';
import { useNowTick } from '../lib/refresh';
import { colors, radius } from '../lib/theme';

const LOCALE_TAGS: Record<Locale, string> = { en: 'en-US', tr: 'tr-TR' };

function clockTime(timestamp: number, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], { timeStyle: 'short' }).format(
    new Date(timestamp),
  );
}

/**
 * Compact freshness row (data-freshness feature): "when was the visible data
 * successfully fetched" + the protected Refresh action, kept out of the
 * navigation header so it never crowds it. The label is driven by TanStack's
 * dataUpdatedAt, so a failed refresh never moves it — failure keeps the old
 * data and states which snapshot is being shown.
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
    <View style={styles.row}>
      <Text
        accessibilityLiveRegion="polite"
        style={[styles.label, failed && styles.labelFailed]}
        numberOfLines={2}
      >
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('refreshDataLabel')}
        onPress={onRefresh}
        disabled={refreshDisabled}
        android_ripple={refreshDisabled ? undefined : { color: colors.ripple }}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          refreshDisabled && styles.buttonDisabled,
        ]}
      >
        {isFetching ? (
          <ActivityIndicator size="small" color={colors.textMuted} />
        ) : (
          <Text style={styles.buttonGlyph}>↻</Text>
        )}
        <Text style={styles.buttonText}>{t('refreshData')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: { flexShrink: 1, fontSize: 12, color: colors.textMuted },
  labelFailed: { color: colors.danger },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  buttonPressed: { backgroundColor: colors.surfacePressed },
  buttonDisabled: { opacity: 0.4 },
  buttonGlyph: { fontSize: 13, color: colors.textSecondary },
  buttonText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
});
