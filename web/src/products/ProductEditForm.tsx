import {
  normalizeStockInput,
  statusLabels,
  type ProductDetail,
  type ProductStatus,
  type ProductUpdateBody,
} from '@stokmate/shared';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useBlocker } from 'react-router';
import { toast } from 'sonner';
import { sessionDeadRef } from '@/auth/session-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/i18n';
import { formatPriceInput, parsePriceInput } from '@/lib/currency-input';
import { describeError } from '@/lib/error-messages';
import { useUpdateProduct } from '@/products/queries';

interface EditFormValues {
  name: string;
  price: string;
  stock: string;
  status: string;
}

const STATUS_VALUES: ProductStatus[] = [1, 2, 3];

/**
 * Product edit form (UX-002/UX-003). `detail` is the fresh GET /products/{id}
 * snapshot taken when Edit was pressed; the PUT body is built from it so every
 * non-editable field round-trips losslessly (the contract's full-replace trap).
 */
export function ProductEditForm({
  detail,
  onSaved,
  onCancel,
}: {
  detail: ProductDetail;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t, locale } = useI18n();
  const mutation = useUpdateProduct();
  // Local confirm for the explicit Cancel action (navigation is covered by the blocker).
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const defaultValues: EditFormValues = {
    name: detail.name,
    price: formatPriceInput(detail.price, locale),
    stock: String(detail.stock),
    status: String(detail.status),
  };
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditFormValues>({ mode: 'onChange', defaultValues });

  const watched = useWatch({ control });
  const values: EditFormValues = { ...defaultValues, ...watched };
  const trimmedName = values.name.trim();
  const parsedPrice = parsePriceInput(values.price);
  const parsedStock = normalizeStockInput(values.stock);
  const statusValue = Number(values.status) as ProductStatus;

  const valid = trimmedName.length > 0 && parsedPrice !== null && parsedStock !== null;
  // Save enablement compares parsed values, so "39,50" vs "39,5" never counts
  // as a change (UX-002: enabled only when something actually changed).
  const changed =
    trimmedName !== detail.name ||
    parsedPrice !== detail.price ||
    parsedStock !== detail.stock ||
    statusValue !== detail.status;
  // The unsaved-changes guard triggers on any user modification, valid or not.
  const guardDirty =
    values.name !== detail.name ||
    (parsedPrice !== detail.price && values.price !== formatPriceInput(detail.price, locale)) ||
    values.stock !== String(detail.stock) ||
    statusValue !== detail.status;

  // UX-003: navigating away (back, list, logout) with unsaved changes asks for
  // confirmation. A dead session's forced return to login is never blocked.
  const blocker = useBlocker(() => guardDirty && !sessionDeadRef.current);

  useEffect(() => {
    if (!guardDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [guardDirty]);

  const onSubmit = handleSubmit(async () => {
    if (parsedPrice === null || parsedStock === null || trimmedName.length === 0) return;
    const body: ProductUpdateBody = {
      // Assignment-editable fields:
      name: trimmedName,
      price: parsedPrice,
      stock: parsedStock,
      status: statusValue,
      // Everything else round-trips verbatim from the fresh detail read:
      sku: detail.sku,
      barcode: detail.barcode,
      categoryId: detail.categoryId,
      brandId: detail.brandId,
      supplierId: detail.supplierId,
      costPrice: detail.costPrice,
      minStock: detail.minStock,
      unit: detail.unit,
      description: detail.description,
      isFeatured: detail.isFeatured,
    };
    try {
      await mutation.mutateAsync({ id: detail.id, body });
      toast.success(t('saveSuccess'));
      onSaved();
    } catch (error) {
      // Failed save: stay in edit mode, entered values preserved (UX-002).
      const described = describeError(error, 'save');
      toast.error(t('saveFailed'), { description: described.detail ?? t(described.key) });
    }
  });

  const cancel = () => {
    if (guardDirty) setCancelConfirmOpen(true);
    else onCancel();
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-6" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="edit-name">{t('fieldName')}</Label>
          <Input
            id="edit-name"
            aria-invalid={!!errors.name}
            {...register('name', {
              validate: (v) => v.trim().length > 0 || t('validationNameRequired'),
            })}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-price">{t('fieldPrice')} (₺)</Label>
          <Input
            id="edit-price"
            inputMode="decimal"
            aria-invalid={!!errors.price}
            {...register('price', {
              validate: (v) => parsePriceInput(v) !== null || t('validationPriceInvalid'),
            })}
          />
          {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-stock">{t('fieldStock')}</Label>
          <Input
            id="edit-stock"
            inputMode="numeric"
            aria-invalid={!!errors.stock}
            {...register('stock', {
              validate: (v) => normalizeStockInput(v) !== null || t('validationStockInvalid'),
            })}
          />
          {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-status">{t('fieldStatus')}</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="edit-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_VALUES.map((status) => (
                    <SelectItem key={status} value={String(status)}>
                      {statusLabels[status][locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Sticky action area (UX-002): Save/Cancel stay reachable on long forms. */}
      <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-background py-3">
        <Button type="submit" disabled={!valid || !changed || mutation.isPending}>
          {mutation.isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
          {t('save')}
        </Button>
        <Button type="button" variant="outline" onClick={cancel} disabled={mutation.isPending}>
          {t('cancel')}
        </Button>
      </div>

      <UnsavedChangesDialog
        open={cancelConfirmOpen}
        onStay={() => setCancelConfirmOpen(false)}
        onDiscard={() => {
          setCancelConfirmOpen(false);
          onCancel();
        }}
      />
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onStay={() => blocker.reset?.()}
        onDiscard={() => blocker.proceed?.()}
      />
    </form>
  );
}

function UnsavedChangesDialog({
  open,
  onStay,
  onDiscard,
}: {
  open: boolean;
  onStay: () => void;
  onDiscard: () => void;
}) {
  const { t } = useI18n();
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onStay()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('unsavedChangesTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('unsavedChangesBody')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onStay}>{t('stay')}</AlertDialogCancel>
          <AlertDialogAction onClick={onDiscard}>{t('discardChanges')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
