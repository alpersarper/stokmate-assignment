import {
  statusLabel,
  type ProductSortField,
  type ProductStatus,
  type SortDirection,
} from '@stokmate/shared';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../i18n';
import type { MessageKey } from '../i18n/messages';
import { colors, radius } from '../lib/theme';
import { useBrands, useCategories } from './queries';

/** 'all' = no status restriction (omit the param). Mobile default is Active (MOB-010). */
export type StatusFilter = ProductStatus | 'all';
export const DEFAULT_STATUS: StatusFilter = 1;

export interface ListFilters {
  status: StatusFilter;
  /** Selected as {id,name} so active-filter chips never depend on the lookup cache. */
  category?: { id: number; name: string };
  brand?: { id: number; name: string };
}

export const DEFAULT_FILTERS: ListFilters = { status: DEFAULT_STATUS };

export type SortOptionKey =
  | 'nameAsc'
  | 'nameDesc'
  | 'priceAsc'
  | 'priceDesc'
  | 'stockAsc'
  | 'stockDesc'
  | 'updatedAsc'
  | 'updatedDesc';

export const DEFAULT_SORT: SortOptionKey = 'nameAsc';

/** Human-labeled sort options mapped to the verified backend sort/dir contract (MOB-008). */
export const SORT_OPTIONS: Record<
  SortOptionKey,
  { sort: ProductSortField; dir: SortDirection; labelKey: MessageKey }
> = {
  nameAsc: { sort: 'name', dir: 'asc', labelKey: 'sortNameAsc' },
  nameDesc: { sort: 'name', dir: 'desc', labelKey: 'sortNameDesc' },
  priceAsc: { sort: 'price', dir: 'asc', labelKey: 'sortPriceAsc' },
  priceDesc: { sort: 'price', dir: 'desc', labelKey: 'sortPriceDesc' },
  stockAsc: { sort: 'stock', dir: 'asc', labelKey: 'sortStockAsc' },
  stockDesc: { sort: 'stock', dir: 'desc', labelKey: 'sortStockDesc' },
  updatedAsc: { sort: 'updatedAt', dir: 'asc', labelKey: 'sortUpdatedAsc' },
  updatedDesc: { sort: 'updatedAt', dir: 'desc', labelKey: 'sortUpdatedDesc' },
};

const STATUS_OPTIONS: StatusFilter[] = [1, 2, 3, 'all'];

export function FilterSheet({
  visible,
  filters,
  onChange,
  onClear,
  onClose,
}: {
  visible: boolean;
  filters: ListFilters;
  onChange: (next: ListFilters) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  // Lookups load lazily, the first time the sheet opens.
  const categoriesQuery = useCategories(visible);
  const brandsQuery = useBrands(visible);

  return (
    <SheetModal visible={visible} onClose={onClose} title={t('filtersButton')}>
      <ScrollView style={styles.sheetScroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>{t('statusFilterLabel')}</Text>
        <View style={styles.chipWrap}>
          {STATUS_OPTIONS.map((option) => (
            <Chip
              key={String(option)}
              label={option === 'all' ? t('allOption') : statusLabel(option, locale)}
              selected={filters.status === option}
              onPress={() => onChange({ ...filters, status: option })}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('categoryFilterLabel')}</Text>
        {categoriesQuery.isPending ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.sectionSpinner} />
        ) : categoriesQuery.isError ? (
          <LookupError onRetry={() => void categoriesQuery.refetch()} />
        ) : (
          <View style={styles.chipWrap}>
            <Chip
              label={t('allCategories')}
              selected={filters.category === undefined}
              onPress={() => onChange({ ...filters, category: undefined })}
            />
            {(categoriesQuery.data ?? []).map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={filters.category?.id === category.id}
                onPress={() =>
                  onChange({ ...filters, category: { id: category.id, name: category.name } })
                }
              />
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('brandFilterLabel')}</Text>
        {brandsQuery.isPending ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.sectionSpinner} />
        ) : brandsQuery.isError ? (
          <LookupError onRetry={() => void brandsQuery.refetch()} />
        ) : (
          <View style={styles.chipWrap}>
            <Chip
              label={t('allBrands')}
              selected={filters.brand === undefined}
              onPress={() => onChange({ ...filters, brand: undefined })}
            />
            {(brandsQuery.data ?? []).map((brand) => (
              <Chip
                key={brand.id}
                label={brand.name}
                selected={filters.brand?.id === brand.id}
                onPress={() => onChange({ ...filters, brand: { id: brand.id, name: brand.name } })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.sheetFooter}>
        <Pressable
          accessibilityRole="button"
          onPress={onClear}
          style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}
        >
          <Text style={styles.ghostButtonText}>{t('clearFilters')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
        >
          <Text style={styles.doneButtonText}>{t('doneButton')}</Text>
        </Pressable>
      </View>
    </SheetModal>
  );
}

export function SortSheet({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: SortOptionKey;
  onSelect: (key: SortOptionKey) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <SheetModal visible={visible} onClose={onClose} title={t('sortButton')}>
      <View style={styles.sortList}>
        {(Object.keys(SORT_OPTIONS) as SortOptionKey[]).map((key) => {
          const active = key === selected;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                onSelect(key);
                onClose();
              }}
              style={({ pressed }) => [styles.sortRow, pressed && styles.pressed]}
            >
              <Text style={[styles.sortRowText, active && styles.sortRowTextActive]}>
                {t(SORT_OPTIONS[key].labelKey)}
              </Text>
              {active ? <Text style={styles.sortCheck}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </SheetModal>
  );
}

/** Shared bottom-sheet shell: RN core Modal, no extra dependency (MOB-007). */
function SheetModal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  // Edge-to-edge Android draws behind the system navigation bar; the sheet's
  // footer controls must clear it (same inset pattern as Snackbar.tsx).
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdropContainer}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function LookupError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <View style={styles.lookupError}>
      <Text style={styles.lookupErrorText}>{t('filtersLoadFailed')}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.ghostButton, pressed && styles.pressed]}
      >
        <Text style={styles.ghostButtonText}>{t('retry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backdropContainer: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: '80%',
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sheetScroll: { flexGrow: 0 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionSpinner: { alignSelf: 'flex-start', marginVertical: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  chip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.text },
  chipTextSelected: { color: colors.onPrimary, fontWeight: '600' },

  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    gap: 12,
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
  },
  ghostButtonText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  doneButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  doneButtonText: { color: colors.onPrimary, fontWeight: '600', fontSize: 14 },

  sortList: { marginTop: 6 },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortRowText: { fontSize: 15, color: colors.text },
  sortRowTextActive: { fontWeight: '700', color: colors.primary },
  sortCheck: { fontSize: 16, fontWeight: '700', color: colors.primary },

  lookupError: { gap: 8, alignItems: 'flex-start', marginVertical: 4 },
  lookupErrorText: { fontSize: 13, color: colors.danger },

  pressed: { opacity: 0.7 },
});
