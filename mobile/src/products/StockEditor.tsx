import {
  MAX_STOCK,
  normalizeStockInput,
  queryKeys,
  type Product,
  type ProductDetail,
} from '@stokmate/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiClient } from '../api/client';
import { useSnackbar } from '../components/Snackbar';
import { PrimaryButton } from '../components/ui';
import { useI18n } from '../i18n';
import { describeFailure } from '../lib/errors';
import { colors, radius } from '../lib/theme';

/**
 * UX-005 stock editor — the primary mobile workflow. The draft is a local
 * string; nothing touches the backend until "Save Stock". Saves go through the
 * dedicated PATCH /products/{id}/stock with a validated numeric value, so the
 * contract's empty-body-sets-zero trap is unreachable. After success the
 * persisted server value (from the PATCH response) is displayed and the detail
 * query is refetched.
 */
export function StockEditor({
  product,
  onDirtyChange,
}: {
  product: ProductDetail;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t } = useI18n();
  const { show } = useSnackbar();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState(String(product.stock));
  const prevStock = useRef(product.stock);

  // Follow background refetches only while the draft is clean; an in-progress
  // edit is never clobbered (UX-005 input stability).
  useEffect(() => {
    if (product.stock !== prevStock.current) {
      if (normalizeStockInput(draft) === prevStock.current) setDraft(String(product.stock));
      prevStock.current = product.stock;
    }
  }, [product.stock, draft]);

  const normalized = normalizeStockInput(draft);
  const invalid = normalized === null;
  const changed = normalized !== product.stock;
  const dirty = invalid || changed;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: (stock: number) => apiClient.updateStock(product.id, stock),
    onSuccess: (updated: Product) => {
      // The PATCH response is the persisted server state: show it immediately,
      // then refetch detail in the background and refresh any list caches.
      queryClient.setQueryData<ProductDetail>(
        queryKeys.products.detail(product.id),
        (old) => (old ? { ...old, ...updated } : old),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(product.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
      setDraft(String(updated.stock));
      prevStock.current = updated.stock;
      show(t('stockSaved'), 'success');
    },
    onError: (error: unknown) => {
      // Failure: draft is preserved untouched; user corrects or retries (UX-005).
      const failure = describeFailure(error, 'stockUpdate');
      show(
        t('stockSaveFailed'),
        'error',
        failure.key === 'errorGeneric' ? failure.detail : t(failure.key),
      );
    },
  });

  const saving = mutation.isPending;
  const canSave = !invalid && changed && !saving;

  function step(delta: 1 | -1) {
    // Steppers act on the parsed draft (or the persisted value when the draft
    // is invalid) so rapid interaction always yields a consistent value.
    const base = normalized ?? product.stock;
    const next = Math.min(MAX_STOCK, Math.max(0, base + delta));
    setDraft(String(next));
  }

  function save() {
    if (!canSave || normalized === null) return;
    mutation.mutate(normalized);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('stockEditorTitle')}</Text>
      <Text style={styles.current}>
        {t('currentStockLabel')}: <Text style={styles.currentValue}>{product.stock}</Text>
      </Text>

      <View style={styles.editorRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('decreaseStock')}
          onPress={() => step(-1)}
          disabled={saving || (normalized ?? product.stock) <= 0}
          style={({ pressed }) => [
            styles.stepButton,
            pressed && styles.stepButtonPressed,
            (saving || (normalized ?? product.stock) <= 0) && styles.stepButtonDisabled,
          ]}
        >
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>

        <TextInput
          style={[styles.input, invalid && styles.inputInvalid]}
          value={draft}
          onChangeText={setDraft}
          keyboardType="number-pad"
          editable={!saving}
          selectTextOnFocus
          accessibilityLabel={t('stockEditorTitle')}
          testID="stock-input"
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('increaseStock')}
          onPress={() => step(1)}
          disabled={saving}
          style={({ pressed }) => [
            styles.stepButton,
            pressed && styles.stepButtonPressed,
            saving && styles.stepButtonDisabled,
          ]}
        >
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>

      {invalid ? <Text style={styles.validationError}>{t('stockInvalid')}</Text> : null}

      <PrimaryButton
        label={saving ? t('savingStock') : t('saveStock')}
        onPress={save}
        disabled={!canSave}
        busy={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  current: { fontSize: 14, color: colors.textSecondary },
  currentValue: { fontWeight: '700', color: colors.text },

  editorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepButton: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPressed: { backgroundColor: colors.border },
  stepButtonDisabled: { opacity: 0.4 },
  stepButtonText: { fontSize: 26, color: colors.text, lineHeight: 30 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.surface,
  },
  inputInvalid: { borderColor: colors.danger },
  validationError: { color: colors.danger, fontSize: 13 },
});
