import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  formatKurus,
  isApiError,
  queryKeys,
  statusLabel,
  unitLabel,
  type Locale,
  type ProductDetail,
} from '@stokmate/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, AppState, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { FreshnessControl } from '../components/FreshnessControl';
import { ErrorState, LoadingState } from '../components/ui';
import { useI18n } from '../i18n';
import { describeFailure } from '../lib/errors';
import { useAnchoredRefetch, useManualRefresh } from '../lib/refresh';
import { colors, radius } from '../lib/theme';
import type { RootStackParamList } from '../navigation-shared';
import { StockEditor } from './StockEditor';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const LOCALE_TAGS: Record<Locale, string> = { en: 'en-US', tr: 'tr-TR' };

/** MOB-004: conservative freshness poll — this product only, only while the
 * detail screen is focused AND the app is foregrounded. Anchored to the last
 * fetch settle (useAnchoredRefetch) so it coordinates with manual refreshes
 * and refocus invalidation instead of stacking on them. */
const DETAIL_POLL_MS = 10_000;

export function ProductDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { t, locale } = useI18n();
  const { status: authStatus } = useAuth();
  const queryClient = useQueryClient();

  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) =>
      setAppActive(next === 'active'),
    );
    return () => subscription.remove();
  }, []);
  const live = isFocused && appActive;

  const query = useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => apiClient.getProduct(id),
  });
  useAnchoredRefetch(query, DETAIL_POLL_MS, live);
  const { refresh, refreshDisabled } = useManualRefresh(query);

  // Targeted refresh on refocus/foreground (MOB-004): one GET /products/{id},
  // never a list refetch. Skips the initial mount — the query fetches anyway.
  const wasLiveRef = useRef(live);
  useEffect(() => {
    if (live && !wasLiveRef.current) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
    }
    wasLiveRef.current = live;
  }, [live, id, queryClient]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: query.data?.name ?? t('productDetailTitle') });
  }, [navigation, query.data?.name, t]);

  // UX-003: leaving with an unsaved stock change requires confirmation.
  const dirtyRef = useRef(false);
  const authStatusRef = useRef(authStatus);
  useEffect(() => {
    authStatusRef.current = authStatus;
  }, [authStatus]);
  const onDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      // Session death unmounts the whole stack — the guard must not fight it.
      if (!dirtyRef.current || authStatusRef.current !== 'signedIn') return;
      event.preventDefault();
      Alert.alert(t('unsavedTitle'), t('unsavedMessage'), [
        { text: t('stay'), style: 'cancel' },
        {
          text: t('discardChanges'),
          style: 'destructive',
          onPress: () => navigation.dispatch(event.data.action),
        },
      ]);
    });
  }, [navigation, t]);

  if (query.isLoading) {
    return <LoadingState label={t('restoringSession')} />;
  }

  // A definitive 404 (product deleted elsewhere) is handled explicitly; a
  // transient refetch failure with cached data keeps the screen usable and
  // surfaces the failure through the FreshnessControl instead (directive:
  // failure keeps previous data, never destroys the working surface).
  const notFound = query.isError && isApiError(query.error) && query.error.status === 404;
  if (!query.data || notFound) {
    const failure = describeFailure(query.error, 'productDetail');
    return (
      <ErrorState
        title={t('detailErrorTitle')}
        detail={failure.key === 'errorGeneric' && failure.detail ? failure.detail : t(failure.key)}
        retryLabel={t('retry')}
        // Protected pipeline: hammering Retry joins the in-flight request.
        onRetry={refresh}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.freshnessRow}>
        <FreshnessControl
          dataUpdatedAt={query.dataUpdatedAt}
          errorUpdatedAt={query.errorUpdatedAt}
          isFetching={query.isFetching}
          onRefresh={refresh}
          refreshDisabled={refreshDisabled}
        />
      </View>
      <DetailContent product={query.data} locale={locale} onDirtyChange={onDirtyChange} />
    </View>
  );
}

function DetailContent({
  product,
  locale,
  onDirtyChange,
}: {
  product: ProductDetail;
  locale: Locale;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useI18n();
  const [imageFailed, setImageFailed] = useState(false);
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= product.minStock;

  const updatedAt = new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(product.updatedAt));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        {imageFailed ? (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.imageFallbackText}>{product.name.slice(0, 1)}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            onError={() => setImageFailed(true)}
          />
        )}
        <View style={styles.headerMain}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatKurus(product.price, locale)}</Text>
          <View style={styles.badgeRow}>
            <Badge label={statusLabel(product.status, locale)} tone="neutral" />
            {outOfStock ? <Badge label={t('outOfStockBadge')} tone="danger" /> : null}
            {lowStock ? <Badge label={t('lowStockBadge')} tone="warning" /> : null}
          </View>
        </View>
      </View>

      <StockEditor product={product} onDirtyChange={onDirtyChange} />

      <View style={styles.infoCard}>
        <InfoRow label={t('skuLabel')} value={product.sku} />
        {product.barcode ? <InfoRow label={t('barcodeLabel')} value={product.barcode} /> : null}
        <InfoRow label={t('categoryLabel')} value={product.categoryName} />
        <InfoRow label={t('brandLabel')} value={product.brandName} />
        <InfoRow label={t('unitFieldLabel')} value={unitLabel(product.unit, locale)} />
        <InfoRow label={t('statusFieldLabel')} value={statusLabel(product.status, locale)} />
        <InfoRow label={t('updatedAtLabel')} value={updatedAt} last={!product.description} />
        {product.description ? (
          <View style={styles.descriptionBlock}>
            <Text style={styles.infoLabel}>{t('descriptionLabel')}</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function Badge({ label, tone }: { label: string; tone: 'neutral' | 'danger' | 'warning' }) {
  return (
    <View style={[styles.badge, badgeTones[tone].box]}>
      <Text style={[styles.badgeText, badgeTones[tone].text]}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const badgeTones = {
  neutral: {
    box: { backgroundColor: '#f5f5f4', borderColor: colors.borderStrong },
    text: { color: colors.textSecondary },
  },
  danger: {
    box: { backgroundColor: colors.dangerSurface, borderColor: colors.dangerBorder },
    text: { color: colors.danger },
  },
  warning: {
    box: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder },
    text: { color: colors.warning },
  },
} as const;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  freshnessRow: { marginHorizontal: 12, marginTop: 8 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 12, gap: 12, paddingBottom: 32 },

  headerCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
  },
  image: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.skeleton },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { fontSize: 32, fontWeight: '700', color: colors.textMuted },
  headerMain: { flex: 1, gap: 6 },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  price: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },

  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 13, color: colors.textMuted },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  descriptionBlock: { paddingVertical: 12, gap: 6 },
  descriptionText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});
