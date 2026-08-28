import { Link, useParams } from 'react-router';
import { useI18n } from '@/i18n';

/** Placeholder — the real detail/edit flow (UX-002/003) is Web Agent scope. */
export function ProductDetailPage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 py-16">
      <h1 className="text-2xl font-semibold">
        {t('productDetailTitle')} #{id}
      </h1>
      <p className="text-neutral-500">{t('placeholderNotice')}</p>
      <Link className="text-sm underline" to="/products">
        {t('backToList')}
      </Link>
    </div>
  );
}
