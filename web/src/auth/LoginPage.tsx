import { Link } from 'react-router';
import { ConnectivityProbe } from '@/components/dev/ConnectivityProbe';
import { useI18n } from '@/i18n';

/** Placeholder — the real login form (UX-007) is Web Agent scope. */
export function LoginPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-16">
      <h1 className="text-2xl font-semibold">{t('loginTitle')}</h1>
      <p className="text-neutral-500">{t('placeholderNotice')}</p>
      <ConnectivityProbe />
      <Link className="text-sm underline" to="/products">
        {t('goToProducts')}
      </Link>
    </div>
  );
}
