import type { UserDto } from '@stokmate/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { apiClient, hasPersistedSession, setRememberPreference, setSessionInvalidHandler } from '@/api/client';
import { sessionDeadRef } from '@/auth/session-state';
import { useI18n } from '@/i18n';

export type AuthStatus = 'restoring' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: UserDto | null;
  status: AuthStatus;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    hasPersistedSession() ? 'restoring' : 'unauthenticated',
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  // Session restore (UX-007): validate a persisted session once on startup so
  // a valid session skips the login screen. Failure paths always resolve the
  // restoring state — auth never hangs in loading.
  const restoreStarted = useRef(false);
  useEffect(() => {
    if (restoreStarted.current || !hasPersistedSession()) return;
    restoreStarted.current = true;
    let cancelled = false;
    apiClient
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        // 401 with failed refresh already cleared tokens via onSessionInvalid;
        // network errors leave tokens for a later attempt but still show login.
        if (cancelled) return;
        setUser(null);
        setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSessionInvalidHandler(() => {
      if (sessionDeadRef.current) return; // one toast/navigation per session death
      sessionDeadRef.current = true;
      setUser(null);
      setStatus('unauthenticated');
      toast.error(t('sessionExpired'));
      navigate('/login', { replace: true });
      queryClient.clear();
    });
    return () => setSessionInvalidHandler(() => {});
  }, [navigate, queryClient, t]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    setRememberPreference(remember);
    const response = await apiClient.login(email, password);
    sessionDeadRef.current = false;
    setUser(response.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await apiClient.logout(); // best-effort server revoke + guaranteed local clear
    setUser(null);
    setStatus('unauthenticated');
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- auth hook module
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
