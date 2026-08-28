import { Link, Outlet, useNavigate, useRouteError } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { useI18n } from '@/i18n';

function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      {t('language')}
      <select
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        value={locale}
        onChange={(e) => setLocale(e.target.value as 'en' | 'tr')}
      >
        <option value="en">{t('languageEnglish')}</option>
        <option value="tr">{t('languageTurkish')}</option>
      </select>
    </label>
  );
}

function Header() {
  const { t } = useI18n();
  const { user, status } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link to="/products" className="font-semibold tracking-tight">
          {t('appTitle')}
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitch />
          {status === 'authenticated' && (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user?.fullName}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  // Route through navigation so a dirty edit form can veto via
                  // its unsaved-changes blocker (UX-003); the login page then
                  // performs the actual logout.
                  navigate('/login', { replace: true, state: { logout: true } })
                }
              >
                {t('logout')}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** Root layout route: auth context + chrome + snackbar host (UX-004: top-right, max 3). */
export function AppLayout() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="mx-auto max-w-6xl px-6 pb-16">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" visibleToasts={3} richColors closeButton />
    </AuthProvider>
  );
}

/** Application-level rendering fallback (UX-004): never a blank screen. */
export function RouteErrorFallback() {
  const { t } = useI18n();
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <h1 className="text-xl font-semibold">{t('appErrorTitle')}</h1>
      <p className="text-muted-foreground">{t('appErrorBody')}</p>
      <Button onClick={() => window.location.reload()}>{t('reload')}</Button>
    </div>
  );
}
