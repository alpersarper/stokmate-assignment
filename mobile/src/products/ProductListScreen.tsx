import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatKurus, queryKeys, statusLabel, type Product } from '@stokmate/shared';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
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
import { apiClient } from '../api/client';
import { EmptyState, ErrorState, LoadingState } from '../components/ui';
import { useI18n } from '../i18n';
import { describeFailure } from '../lib/errors';
import { colors, radius } from '../lib/theme';
import type { RootStackParamList } from '../navigation-shared';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductList'>;

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export function ProductListScreen({ navigation }: Props) {
  const { t } = useI18n();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // UX-001: 300 ms debounce, whitespace ignored, clearing restores the default list.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const listParams = useMemo(() => (search ? { q: search } : {}), [search]);

  const query = useInfiniteQuery({
    queryKey: queryKeys.products.list(listParams),
    queryFn: ({ pageParam }) =>
      apiClient.getProducts({ ...listParams, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize >= last.total ? undefined : last.page + 1,
    // Keep the previous result set visible while a new search loads (UX-001).
    placeholderData: keepPreviousData,
  });

  const products = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await query.refetch();
    } finally {
      setRefreshing(false);
    }
  }

  function onEndReached() {
    // Guard prevents duplicate concurrent page requests and requests past the last page.
    if (query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError) {
      void query.fetchNextPage();
    }
  }

  const showBackgroundFetch =
    query.isFetching && !query.isLoading && !query.isFetchingNextPage && !refreshing;

  let content: React.ReactElement;
  if (query.isLoading) {
    content = <LoadingState label={t('loadingProducts')} />;
  } else if (query.isError && products.length === 0) {
    const failure = describeFailure(query.error, 'productList');
    content = (
      <ErrorState
        title={t('listErrorTitle')}
        detail={failure.key === 'errorGeneric' && failure.detail ? failure.detail : t(failure.key)}
        retryLabel={t('retry')}
        onRetry={() => void query.refetch()}
      />
    );
  } else {
    content = (
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
          />
        )}
        contentContainerStyle={products.length === 0 ? styles.emptyListContent : styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          search ? (
            <EmptyState
              title={t('noResultsTitle')}
              body={t('noResultsBody')}
              action={
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSearchInput('')}
                  style={({ pressed }) => [styles.clearAction, pressed && styles.pressed]}
                >
                  <Text style={styles.clearActionText}>{t('clearSearch')}</Text>
                </Pressable>
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
            </View>
          ) : query.isFetchNextPageError ? (
            <View style={styles.footer}>
              <Text style={styles.footerErrorText}>{t('loadMoreFailed')}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void query.fetchNextPage()}
                style={({ pressed }) => [styles.clearAction, pressed && styles.pressed]}
              >
                <Text style={styles.clearActionText}>{t('retry')}</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    );
  }

  return (
    <View style={styles.container}>
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
      {content}
    </View>
  );
}

/** Compact row (UX-006 mobile): name + stock prioritized, secondary info muted, chevron. */
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
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowName} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.rowSecondary} numberOfLines={1}>
          {secondary.join(' · ')}
        </Text>
      </View>
      <View style={styles.rowSide}>
        <Text
          style={[
            styles.rowStock,
            outOfStock && styles.rowStockOut,
            lowStock && styles.rowStockLow,
          ]}
        >
          {t('stockLabel')}: {product.stock}
        </Text>
        <Text style={styles.rowPrice}>{formatKurus(product.price, locale)}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  searchSpinner: { marginRight: 12 },
  searchClear: { paddingHorizontal: 12, paddingVertical: 8 },
  searchClearText: { color: colors.textMuted, fontSize: 15 },

  listContent: { padding: 12, gap: 8, paddingBottom: 24 },
  emptyListContent: { flexGrow: 1 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 8,
    gap: 8,
  },
  rowPressed: { backgroundColor: '#f0f0ef' },
  rowMain: { flex: 1, gap: 3 },
  rowName: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSecondary: { fontSize: 12, color: colors.textMuted },
  rowSide: { alignItems: 'flex-end', gap: 3 },
  rowStock: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowStockOut: { color: colors.danger },
  rowStockLow: { color: colors.warning },
  rowPrice: { fontSize: 12, color: colors.textMuted },
  chevron: { fontSize: 22, color: colors.borderStrong, paddingHorizontal: 4 },

  footer: { paddingVertical: 16, alignItems: 'center', gap: 8 },
  footerErrorText: { color: colors.danger, fontSize: 13 },

  clearAction: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  clearActionText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  pressed: { opacity: 0.7 },
});
