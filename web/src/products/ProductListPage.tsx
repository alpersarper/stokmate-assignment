import { Link } from 'react-router';
import { useI18n } from '@/i18n';

/** Placeholder — the real list (search/filter/pagination) is Web Agent scope. */
export function ProductListPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-16">
      <h1 className="text-2xl font-semibold">{t('productsTitle')}</h1>
      <p className="text-neutral-500">{t('placeholderNotice')}</p>
      <div className="flex gap-4 text-sm underline">
        <Link to="/products/1">{t('productDetailTitle')} #1</Link>
        <Link to="/login">{t('goToLogin')}</Link>
      </div>
    </div>
  );
}
