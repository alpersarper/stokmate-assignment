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
import { colors, elevation, numeral, radius, spacing, type } from '../lib/theme';
import { applyProductToCaches } from './product-cache';

/**
 * UX-005 stock editor — the primary mobile workflow. The draft is a local
 * string; nothing touches the backend until "Save Stock". Saves go through the
 * dedicated PATCH /products/{id}/stock with a validated numeric value, so the
 * contract's empty-body-sets-zero trap is unreachable. The PATCH response is
 * canonical server state and is applied to the detail + list caches directly
 * (MOB-003) — no page-by-page refetch. Discontinued products are stock-locked
 * (DOMAIN/API-003): controls disabled here, rule enforced by the backend.
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

  const discontinued = product.status === 3;

  const [draft, setDraft] = useState(String(product.stock));
  const prevStock = useRef(product.stock);
  const [externalChange, setExternalChange] = useState(false);

  // Server stock moved underneath us (detail poll/refocus or another client):
  // a clean draft follows the server automatically; a dirty draft is never
  // silently overwritten — the change is surfaced instead (MOB-004).
  useEffect(() => {
    if (product.stock !== prevStock.current) {
      if (normalizeStockInput(draft) === prevStock.current) {
        setDraft(String(product.stock));
      } else {
        setExternalChange(true);
      }
      prevStock.current = product.stock;
    }
  }, [product.stock, draft]);

  const normalized = normalizeStockInput(draft);
  const invalid = normalized === null;
  const changed = normalized !== product.stock;
  const dirty = !discontinued && (invalid || changed);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: (stock: number) => apiClient.updateStock(product.id, stock),
    onSuccess: (updated: Product) => {
      // Canonical persisted state → patch detail + every cached list dataset
      // in place. No invalidation, no page refetch storm (MOB-003).
      prevStock.current = updated.stock;
      applyProductToCaches(queryClient, updated);
      setDraft(String(updated.stock));
      setExternalChange(false);
      show(t('stockSaved'), 'success');
    },
    onError: (error: unknown) => {
      const failure = describeFailure(error, 'stockUpdate');
      if (failure.key === 'stockDiscontinuedConflict') {
        // Stale client raced a discontinue from elsewhere: domain-specific
        // feedback, then one targeted detail refetch — the fresh server state
        // flips this editor into the disabled Discontinued presentation.
        show(t('stockDiscontinuedConflict'), 'error');
        void queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(product.id) });
        return;
      }
      // Other failures: draft preserved untouched; user corrects or retries.
      show(
        t('stockSaveFailed'),
        'error',
        failure.key === 'errorGeneric' ? failure.detail : t(failure.key),
      );
    },
  });

  const saving = mutation.isPending;
  const canSave = !invalid && changed && !saving && !discontinued;
  const stepDisabledDown = saving || discontinued || (normalized ?? product.stock) <= 0;
  const stepDisabledUp = saving || discontinued;

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
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('stockEditorTitle')}</Text>
        <Text style={styles.current}>
          {t('currentStockLabel')}: <Text style={styles.currentValue}>{product.stock}</Text>
        </Text>
      </View>

      {discontinued ? (
        <View style={[styles.notice, styles.noticeDanger]}>
          <Text style={styles.noticeDangerText}>{t('stockDiscontinuedNotice')}</Text>
        </View>
      ) : null}
      {!discontinued && externalChange && changed ? (
        <View style={[styles.notice, styles.noticeWarning]}>
          <Text style={styles.noticeWarningText}>
            {t('externalStockChange', { stock: product.stock })}
          </Text>
        </View>
      ) : null}

      <View style={styles.editorRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('decreaseStock')}
          onPress={() => step(-1)}
          disabled={stepDisabledDown}
          android_ripple={stepDisabledDown ? undefined : { color: colors.ripple }}
          style={({ pressed }) => [
            styles.stepButton,
            pressed && styles.stepButtonPressed,
            stepDisabledDown && styles.stepButtonDisabled,
          ]}
        >
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>

        <TextInput
          style={[
            styles.input,
            invalid && !discontinued && styles.inputInvalid,
            discontinued && styles.inputDisabled,
          ]}
          // Discontinued is not editable: the field mirrors the server value
          // (the local draft is preserved in case the status is reverted).
          value={discontinued ? String(product.stock) : draft}
          onChangeText={setDraft}
          keyboardType="number-pad"
          editable={!saving && !discontinued}
          selectTextOnFocus
          accessibilityLabel={t('stockEditorTitle')}
          testID="stock-input"
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('increaseStock')}
          onPress={() => step(1)}
          disabled={stepDisabledUp}
          android_ripple={stepDisabledUp ? undefined : { color: colors.ripple }}
          style={({ pressed }) => [
            styles.stepButton,
            pressed && styles.stepButtonPressed,
            stepDisabledUp && styles.stepButtonDisabled,
          ]}
        >
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>

      {invalid && !discontinued ? (
        <Text style={styles.validationError}>{t('stockInvalid')}</Text>
      ) : null}

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
  // The screen's single raised surface — stock update is the primary
  // workflow (UX-005), so this card leads the depth hierarchy.
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevation.raised,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { ...type.title },
  current: { fontSize: 13, color: colors.textSecondary },
  currentValue: { fontWeight: '700', color: colors.text, ...numeral },

  notice: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  noticeDanger: { backgroundColor: colors.dangerSurface, borderColor: colors.dangerBorder },
  noticeDangerText: { fontSize: 13, color: colors.danger, lineHeight: 18 },
  noticeWarning: { backgroundColor: colors.warningSurface, borderColor: colors.warningBorder },
  noticeWarningText: { fontSize: 13, color: colors.warning, lineHeight: 18 },

  editorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepButton: {
    width: 54,
    height: 54,
    borderRadius: radius.md + 2,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stepButtonPressed: { backgroundColor: colors.surfacePressed },
  stepButtonDisabled: { opacity: 0.4 },
  stepButtonText: { fontSize: 28, color: colors.text, lineHeight: 32 },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.surfaceMuted,
    borderRadius: radius.md + 2,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.surfaceMuted,
    ...numeral,
  },
  inputInvalid: { borderColor: colors.danger, backgroundColor: colors.dangerSurface },
  inputDisabled: {
    color: colors.disabledText,
    backgroundColor: colors.disabledSurface,
    borderColor: colors.disabledSurface,
  },
  validationError: { color: colors.danger, fontSize: 13 },
});
