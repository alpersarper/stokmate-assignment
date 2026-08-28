import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate, type Location } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n';
import { describeError } from '@/lib/error-messages';

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

interface LoginLocationState {
  from?: Location;
  logout?: boolean;
}

export function LoginPage() {
  const { t } = useI18n();
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? null) as LoginLocationState | null;
  const isLogoutIntent = state?.logout === true;
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '', remember: false },
  });

  // Logout arrives as a navigation (so unsaved-changes blockers can veto it,
  // UX-003); the actual logout runs here, once.
  const logoutRan = useRef(false);
  useEffect(() => {
    if (!isLogoutIntent || logoutRan.current) return;
    logoutRan.current = true;
    void auth.logout().then(() => toast.success(t('logoutSuccess')));
    navigate('/login', { replace: true, state: null });
  }, [isLogoutIntent, auth, navigate, t]);

  // A valid session skips unnecessary login (UX-007).
  if (auth.status === 'authenticated' && !isLogoutIntent) {
    const from = state?.from;
    const target = from ? `${from.pathname}${from.search}` : '/products';
    return <Navigate to={target} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    clearErrors('root');
    try {
      await auth.login(values.email.trim(), values.password, values.remember);
      const from = state?.from;
      navigate(from ? `${from.pathname}${from.search}` : '/products', { replace: true });
    } catch (error) {
      // Failed authentication: preserve email, clear password (UX-007).
      setValue('password', '');
      const described = describeError(error, 'login');
      setError('root', { message: t(described.key) });
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">{t('loginTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('loginSubtitle')}</p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t('emailLabel')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            {...register('email', { required: t('emailRequired') })}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t('passwordLabel')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-10"
              aria-invalid={!!errors.password}
              {...register('password', { required: t('passwordRequired') })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" aria-hidden />
              ) : (
                <EyeIcon className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="remember"
            render={({ field }) => (
              <Checkbox
                id="remember"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          <Label htmlFor="remember" className="font-normal">
            {t('rememberMe')}
          </Label>
        </div>

        {errors.root && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {errors.root.message}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
          {t('signIn')}
        </Button>
      </form>
    </div>
  );
}
