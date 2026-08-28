import { statusLabel, type ProductStatus } from '@stokmate/shared';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n';

/**
 * Status as a labeled badge (UX-008): meaning is carried by the human-readable
 * label; color is reinforcement only.
 */
export function StatusBadge({ status }: { status: ProductStatus }) {
  const { locale } = useI18n();
  const variant = status === 1 ? 'secondary' : status === 2 ? 'outline' : 'destructive';
  const tint = status === 1 ? 'bg-emerald-100 text-emerald-800' : undefined;
  return (
    <Badge variant={variant} className={tint}>
      {statusLabel(status, locale)}
    </Badge>
  );
}

/**
 * Stock with verified low-stock emphasis (UX-008): zero stock gets strong
 * emphasis; low stock uses the API's own signal (0 < stock <= minStock, the
 * relation behind GET /products/stats) — no invented client threshold.
 */
export function StockIndicator({ stock, minStock }: { stock: number; minStock: number }) {
  const { t } = useI18n();
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="font-semibold text-destructive tabular-nums">0</span>
        <Badge variant="destructive">{t('outOfStock')}</Badge>
      </span>
    );
  }
  if (stock <= minStock) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="font-medium text-amber-700 tabular-nums">{stock}</span>
        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
          {t('lowStock')}
        </Badge>
      </span>
    );
  }
  return <span className="tabular-nums">{stock}</span>;
}
