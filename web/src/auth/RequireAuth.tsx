import { Loader2Icon } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/auth/AuthProvider';
import { useI18n } from '@/i18n';

/** Route guard: restoring → spinner; unauthenticated → login; else render. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  const { t } = useI18n();

  if (status === 'restoring') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin" aria-hidden />
        <span>{t('loading')}</span>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
