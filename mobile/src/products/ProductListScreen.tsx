import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  formatKurus,
  normalizeListParams,
  queryKeys,
  statusLabel,
  type Product,
  type ProductListParams,
} from '@stokmate/shared';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient } from '../api/client';
import { FreshnessControl } from '../components/FreshnessControl';
import { EmptyState, ErrorState, SkeletonList, TonalButton } from '../components/ui';
import { useI18n } from '../i18n';
import { describeFailure } from '../lib/errors';
import { useManualRefresh } from '../lib/refresh';
import { colors, elevation, numeral, radius, spacing, type } from '../lib/theme';
import type { RootStackParamList } from '../navigation-shared';
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT,
  FilterSheet,
  SORT_OPTIONS,
  SortSheet,
  type ListFilters,
  type SortOptionKey,
} from './ListControls';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductList'>;

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Product list — one dataset identity (search + category + brand + status +
 * sort + direction) mapped to one TanStack infinite query. The page number
 * lives inside the infinite-query progression; changing any dataset-defining
 * input starts a fresh page-1 result set under a new query key. Pagination
 * appends only; the dataset refreshes only through the protected manual
 * pipeline — pull-to-refresh and the Refresh action, never from scrolling —
 * and mutations patch these caches directly (see product-cache.ts).
 */
export function ProductListScreen({ navigation }: Props) {
  const { t, locale } = useI18n();
  // Edge-to-edge Android: scrolled content must clear the system nav bar.
  const insets = useSafeAreaInsets();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ListFilters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortOptionKey>(DEFAULT_SORT);
  const [pullActive, setPullActive] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);

  // UX-001 / MOB-006: 300 ms debounce → exactly one request per settled input,
  // whitespace ignored, clearing restores the current filtered dataset.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Dataset identity (MOB-006..010): all server-side, combined in one query.
  // Server defaults (sort=name, dir=asc) are omitted; `status` is sent for any
  // concrete selection — the default is Active (MOB-010) — and omitted for All.
  const listParams = useMemo<ProductListParams>(() => {
    const params: ProductListParams = {};
    if (search) params.q = search;
    if (filters.category) params.categoryId = filters.category.id;
    if (filters.brand) params.brandId = filters.brand.id;
    if (filters.status !== 'all') params.status = filters.status;
    const sort = SORT_OPTIONS[sortKey];
    if (sortKey !== DEFAULT_SORT) {
      params.sort = sort.sort;
      params.dir = sort.dir;
    }
    return params;
  }, [search, filters, sortKey]);

  const query = useInfiniteQuery({
    queryKey: queryKeys.products.list(listParams),
    queryFn: ({ pageParam }) =>
      apiClient.getProducts({ ...listParams, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize >= last.total ? undefined : last.page + 1,
    // Keep the previous result set visible while a new dataset loads — no
    // blanking during search/filter/sort changes (MOB-006).
    placeholderData: keepPreviousData,
  });

  const products = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );
  const pages = query.data?.pages;
  // Backend-filtered total (MOB-009) — from the newest loaded page, never the
  // loaded-row count.
  const total = pages?.length ? pages[pages.length - 1]!.total : undefined;

  const listRef = useRef<FlatList<Product>>(null);

  /**
   * MOB-002: one fetchNextPage per genuine user gesture. Armed exactly once
   * per physical gesture, in onScrollBeginDrag only — every user scroll,
   * slow drag or strong flick, begins with a drag, and the momentum phase
   * that may follow belongs to that same gesture. Consumed by the first
   * onEndReached the gesture produces. onMomentumScrollBegin deliberately
   * does NOT arm: it fires mid-gesture at drag→momentum hand-off, so arming
   * there re-opened the guard after the first fetch had consumed it, and the
   * appended page re-triggering onEndReached (content growth keeps the offset
   * near the threshold) could request a second page from the same flick — the
   * reproduced senior-review HIGH defect. A new page now requires a new drag.
   * Query-level guards keep at most one request in flight and stop at the
   * backend-reported end.
   */
  const scrollArmedRef = useRef(false);
  const armScroll = () => {
    scrollArmedRef.current = true;
  };

  function onEndReached() {
    if (!scrollArmedRef.current) return;
    scrollArmedRef.current = false;
    if (
      query.isPlaceholderData || // dataset switching: never paginate the outgoing dataset
      !query.hasNextPage ||
      query.isFetchingNextPage ||
      query.isFetchNextPageError // failures pause pagination until the explicit footer Retry
    ) {
      return;
    }
    void query.fetchNextPage();
  }

  // Dataset change → page 1 of a fresh result set, scrolled to the top
  // (MOB-006/007/008). Appending page N+1 leaves this untouched (MOB-001).
  const datasetKey = useMemo(() => JSON.stringify(normalizeListParams(listParams)), [listParams]);
  const prevDatasetKey = useRef(datasetKey);
  useEffect(() => {
    if (prevDatasetKey.current === datasetKey) return;
    prevDatasetKey.current = datasetKey;
    scrollArmedRef.current = false;
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [datasetKey]);

  // Pull-to-refresh and the Refresh action share ONE protected pipeline: a
  // pull that lands during cooldown or an in-flight fetch starts nothing and
  // the spinner retracts immediately.
  const { refresh, refreshDisabled } = useManualRefresh(query);
  function onPullRefresh() {
    const started = refresh();
    if (!started) return;
    setPullActive(true);
    void started.finally(() => setPullActive(false));
  }

  const filtersRestricting =
    filters.status !== 'all' || filters.category !== undefined || filters.brand !== undefined;
  const filterCount =
    (filters.status !== 'all' ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.brand ? 1 : 0);
  const nonDefaultFilters =
    filters.status !== DEFAULT_FILTERS.status ||
    filters.category !== undefined ||
    filters.brand !== undefined;

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const showBackgroundFetch =
    query.isFetching && !query.isLoading && !query.isFetchingNextPage && !pullActive;

  let content: React.ReactElement;
  if (query.isLoading) {
    content = <SkeletonList />;
  } else if (query.isError && products.length === 0) {
    const failure = describeFailure(query.error, 'productList');
    content = (
      <ErrorState
        title={t('listErrorTitle')}
        detail={failure.key === 'errorGeneric' && failure.detail ? failure.detail : t(failure.key)}
        retryLabel={t('retry')}
        // Protected pipeline: hammering Retry joins the in-flight request.
        onRetry={refresh}
      />
    );
  } else {
    content = (
      <FlatList
        ref={listRef}
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
          />
        )}
        contentContainerStyle={
          products.length === 0
            ? styles.emptyListContent
            : [styles.listContent, { paddingBottom: 24 + insets.bottom }]
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={pullActive}
            onRefresh={onPullRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.surface}
          />
        }
        onScrollBeginDrag={armScroll}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          search ? (
            <EmptyState
              title={t('noResultsTitle')}
              body={t('noResultsBody')}
              action={<TonalButton label={t('clearSearch')} onPress={() => setSearchInput('')} />}
            />
          ) : filtersRestricting ? (
            <EmptyState
              title={t('noFilterResultsTitle')}
              body={t('noFilterResultsBody')}
              action={
                <TonalButton
                  label={t('clearFilters')}
                  onPress={() => setFilters({ status: 'all' })}
                />
              }
            />
          ) : (
            <EmptyState title={t('emptyCatalogTitle')} body={t('emptyCatalogBody')} />
          )
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.footerText}>{t('loadingMore')}</Text>
            </View>
          ) : query.isFetchNextPageError ? (
            <View style={styles.footer}>
              <Text style={styles.footerErrorText}>{t('loadMoreFailed')}</Text>
              <TonalButton label={t('retry')} onPress={() => void query.fetchNextPage()} />
            </View>
          ) : !query.hasNextPage && !query.isPlaceholderData && products.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('endOfList')}</Text>
            </View>
          ) : null
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chrome}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            testID="product-search"
          />
          {showBackgroundFetch ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.searchSpinner} />
          ) : searchInput ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('clearSearch')}
              onPress={() => setSearchInput('')}
              style={({ pressed }) => [styles.searchClear, pressed && styles.pressed]}
            >
              <Text style={styles.searchClearText}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.controlsRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setFilterSheetVisible(true)}
            android_ripple={{ color: colors.ripple }}
            style={({ pressed }) => [
              styles.controlButton,
              filterCount > 0 && styles.controlButtonActive,
              pressed && styles.controlPressed,
            ]}
            testID="filters-button"
          >
            <Text
              style={[styles.controlButtonText, filterCount > 0 && styles.controlButtonTextActive]}
            >
              {t('filtersButton')}
              {filterCount > 0 ? ` · ${filterCount}` : ''}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSortSheetVisible(true)}
            android_ripple={{ color: colors.ripple }}
            style={({ pressed }) => [
              styles.controlButton,
              styles.sortControl,
              pressed && styles.controlPressed,
            ]}
            testID="sort-button"
          >
            <Text style={styles.controlButtonText} numberOfLines={1}>
              {t('sortButton')}: {t(SORT_OPTIONS[sortKey].labelKey)}
            </Text>
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          {typeof total === 'number' ? (
            <Text style={styles.countText} testID="product-count">
              {total === 1
                ? t('productCountOne', { count: total })
                : t('productCount', { count: total })}
            </Text>
          ) : null}
          <ActiveFilterChip
            label={`${t('statusFilterLabel')}: ${
              filters.status === 'all' ? t('allOption') : statusLabel(filters.status, locale)
            }`}
          />
          {filters.category ? <ActiveFilterChip label={filters.category.name} /> : null}
          {filters.brand ? <ActiveFilterChip label={filters.brand.name} /> : null}
          {nonDefaultFilters ? (
            <Pressable
              accessibilityRole="button"
              onPress={clearFilters}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.clearFiltersText}>{t('clearFilters')}</Text>
            </Pressable>
          ) : null}
        </View>

        <FreshnessControl
          dataUpdatedAt={query.dataUpdatedAt}
          errorUpdatedAt={query.errorUpdatedAt}
          isFetching={query.isFetching}
          onRefresh={refresh}
          refreshDisabled={refreshDisabled}
        />
      </View>

      {content}

      <FilterSheet
        visible={filterSheetVisible}
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
        onClose={() => setFilterSheetVisible(false)}
      />
      <SortSheet
        visible={sortSheetVisible}
        selected={sortKey}
        onSelect={setSortKey}
        onClose={() => setSortSheetVisible(false)}
      />
    </View>
  );
}

function ActiveFilterChip({ label }: { label: string }) {
  return (
    <View style={styles.activeChip}>
      <Text style={styles.activeChipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Compact row (UX-006 mobile): name + stock prioritized, secondary info
 * muted. The right rail is a stat block — stock numeral with a caption
 * beneath (the semantic low/out label when it applies, per UX-008; the plain
 * localized "Stock" caption otherwise) and the price under it.
 */
function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
  const { t, locale } = useI18n();
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= product.minStock;
  const secondary = [product.sku, product.categoryName, product.brandName];
  if (product.status !== 1) secondary.push(statusLabel(product.status, locale));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={{ color: colors.ripple }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowName} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.rowSecondary} numberOfLines={1}>
          {secondary.join(' · ')}
        </Text>
        <Text style={styles.rowPrice}>{formatKurus(product.price, locale)}</Text>
      </View>
      <View style={styles.rowSide}>
        <Text
          style={[
            styles.rowStock,
            outOfStock && styles.rowStockOut,
            lowStock && styles.rowStockLow,
          ]}
        >
          {product.stock}
        </Text>
        {/* UX-008: the low/zero-stock signal must not rely on color alone. */}
        {outOfStock ? (
          <Text style={[styles.rowStockFlag, styles.rowStockOut]}>{t('outOfStockBadge')}</Text>
        ) : lowStock ? (
          <Text style={[styles.rowStockFlag, styles.rowStockLow]}>{t('lowStockBadge')}</Text>
        ) : (
          <Text style={styles.rowStockCaption}>{t('stockLabel')}</Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Search + controls + summary form one white chrome sheet under the
  // header; the result list scrolls on the stone ground beneath it.
  chrome: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  searchSpinner: { marginRight: spacing.lg },
  searchClear: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopRightRadius: radius.pill,
    borderBottomRightRadius: radius.pill,
  },
  searchClearText: { color: colors.textMuted, fontSize: 15 },

  controlsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  controlButton: {
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  controlButtonActive: { backgroundColor: colors.primarySurface },
  controlPressed: { backgroundColor: colors.surfacePressed },
  sortControl: { flexShrink: 1 },
  controlButtonText: { fontSize: 13, fontWeight: '600', color: colors.text },
  controlButtonTextActive: { color: colors.primary },

  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  countText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  activeChip: {
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceMuted,
    maxWidth: 160,
  },
  activeChipText: { fontSize: 11, fontWeight: '500', color: colors.textSecondary },
  clearFiltersText: { fontSize: 12, fontWeight: '600', color: colors.primary },

  listContent: { padding: spacing.lg, gap: 10, paddingBottom: 24 },
  emptyListContent: { flexGrow: 1 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md + 2,
    paddingVertical: spacing.md,
    paddingLeft: 14,
    paddingRight: spacing.sm,
    gap: spacing.md,
    overflow: 'hidden',
    ...elevation.card,
  },
  rowPressed: { backgroundColor: '#f7f6f4' },
  rowMain: { flex: 1, gap: 3 },
  rowName: { ...type.item },
  rowSecondary: { ...type.meta },
  rowPrice: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginTop: 2 },
  rowSide: { alignItems: 'flex-end', gap: 2, minWidth: 56 },
  rowStock: { fontSize: 18, fontWeight: '700', color: colors.text, ...numeral },
  rowStockOut: { color: colors.danger },
  rowStockLow: { color: colors.warning },
  rowStockFlag: { fontSize: 11, fontWeight: '600' },
  rowStockCaption: { fontSize: 11, color: colors.textMuted },
  chevron: { fontSize: 22, color: colors.borderStrong, paddingRight: 2 },

  footer: { paddingVertical: spacing.lg, alignItems: 'center', gap: spacing.sm },
  footerText: { color: colors.textMuted, fontSize: 13 },
  footerErrorText: { color: colors.danger, fontSize: 13 },

  pressed: { opacity: 0.7 },
});
