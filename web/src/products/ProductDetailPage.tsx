import { formatKurus, isApiError, unitLabel, type ProductDetail } from '@stokmate/shared';
import { ArrowLeftIcon, ImageOffIcon, Loader2Icon, PencilIcon, TriangleAlertIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n';
import { ProductEditForm } from '@/products/ProductEditForm';
import { StatusBadge, StockIndicator } from '@/products/product-display';
import { useProductDetail } from '@/products/queries';

interface DetailLocationState {
  /** Query string of the list the user came from, so back restores its state. */
  listSearch?: string;
}

export function ProductDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const listSearch = (location.state as DetailLocationState | null)?.listSearch ?? '';
  const backTo = `/products${listSearch}`;

  const id = Number(params.id);
  const idValid = Number.isInteger(id) && id > 0;
  const detailQuery = useProductDetail(id);

  // Editing works on a frozen snapshot taken by an explicit fresh read when
  // Edit is pressed — the PUT body must derive from up-to-date server state.
  const [editBaseline, setEditBaseline] = useState<ProductDetail | null>(null);
  const [startingEdit, setStartingEdit] = useState(false);

  const startEdit = async () => {
    setStartingEdit(true);
    try {
      const result = await detailQuery.refetch();
      if (result.data) setEditBaseline(result.data);
      else toast.error(t('editLoadFailed'));
    } finally {
      setStartingEdit(false);
    }
  };

  const backLink = (
    <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeftIcon className="size-4" aria-hidden />
      {t('backToList')}
    </Link>
  );

  if (!idValid || (detailQuery.isError && isApiError(detailQuery.error) && detailQuery.error.status === 404)) {
    return (
      <div className="flex flex-col gap-6 py-8">
        {backLink}
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-16 text-center">
          <TriangleAlertIcon className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">{t('productNotFoundTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('productNotFoundBody')}</p>
          <Button variant="outline" asChild>
            <Link to={backTo}>{t('backToList')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (detailQuery.isPending) {
    return (
      <div className="flex flex-col gap-6 py-8">
        {backLink}
        <div className="flex flex-col gap-4 rounded-lg border border-border p-6">
          <Skeleton className="h-8 w-1/2" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (detailQuery.isError && !detailQuery.data) {
    return (
      <div className="flex flex-col gap-6 py-8">
        {backLink}
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-16 text-center">
          <TriangleAlertIcon className="size-8 text-destructive" aria-hidden />
          <p className="font-medium">{t('detailErrorTitle')}</p>
          <Button variant="outline" onClick={() => void detailQuery.refetch()}>
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  const detail = detailQuery.data;
  if (!detail) return null;
  const editing = editBaseline !== null;

  return (
    <div className="flex flex-col gap-6 py-8">
      {backLink}

      <div className="rounded-lg border border-border p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <ProductImage src={detail.imageUrl} alt={detail.name} />
            <div>
              <h1 className="text-2xl font-semibold">{detail.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{detail.sku}</p>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={detail.status} />
                {detailQuery.isFetching && (
                  <Loader2Icon className="size-4 animate-spin text-muted-foreground" aria-hidden />
                )}
              </div>
            </div>
          </div>
          {!editing && (
            <Button onClick={() => void startEdit()} disabled={startingEdit}>
              {startingEdit ? (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              ) : (
                <PencilIcon className="size-4" aria-hidden />
              )}
              {t('edit')}
            </Button>
          )}
        </div>

        {editing ? (
          <>
            <h2 className="mb-4 text-lg font-medium">{t('editingTitle')}</h2>
            <ProductEditForm
              detail={editBaseline}
              onSaved={() => setEditBaseline(null)}
              onCancel={() => setEditBaseline(null)}
            />
          </>
        ) : (
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
            <DetailField label={t('fieldPrice')}>
              <span className="tabular-nums">{formatKurus(detail.price, locale)}</span>
            </DetailField>
            <DetailField label={t('fieldStock')}>
              <StockIndicator stock={detail.stock} minStock={detail.minStock} />
            </DetailField>
            <DetailField label={t('fieldCategory')}>{detail.categoryName}</DetailField>
            <DetailField label={t('fieldBrand')}>{detail.brandName}</DetailField>
            <DetailField label={t('fieldMinStock')}>
              <span className="tabular-nums">{detail.minStock}</span>
            </DetailField>
            <DetailField label={t('fieldUnit')}>{unitLabel(detail.unit, locale)}</DetailField>
            <DetailField label={t('fieldBarcode')}>
              {detail.barcode || <span className="text-muted-foreground">—</span>}
            </DetailField>
            <DetailField label={t('fieldUpdatedAt')}>
              {new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(detail.updatedAt))}
            </DetailField>
            {detail.description && (
              <div className="md:col-span-2">
                <DetailField label={t('fieldDescription')}>{detail.description}</DetailField>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/** Product image with graceful fallback — image hosting needs internet. */
function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex size-20 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
        <ImageOffIcon className="size-6" aria-hidden />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="size-20 rounded-lg border border-border object-cover"
      onError={() => setFailed(true)}
    />
  );
}
