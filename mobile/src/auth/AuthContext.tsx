import { isApiError, type UserDto } from '@stokmate/shared';
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
import { apiClient, setSessionInvalidHandler } from '../api/client';
import { useSnackbar } from '../components/Snackbar';
import { useI18n } from '../i18n';
import { restoreTokens, setRememberSession } from './token-store';

export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: UserDto | null;
  /** Throws on failure (ApiError). Caller surfaces the localized message. */
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session state (docs/ARCHITECTURE.md §4): tokens live in the storage adapter,
 * this context only holds { user, status }. The navigator renders the Login vs
 * App stack from `status`, so flipping to signedOut IS the stack reset — after
 * session death or logout no protected screen remains reachable via history.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [user, setUser] = useState<UserDto | null>(null);
  const { show } = useSnackbar();
  const { t } = useI18n();

  // The session-invalid handler must always see current state/translations.
  const statusRef = useRef(status);
  const notifyRef = useRef<() => void>(() => {});
  useEffect(() => {
    statusRef.current = status;
    notifyRef.current = () => show(t('sessionExpired'), 'error');
  });

  useEffect(() => {
    setSessionInvalidHandler(() => {
      // Silent during startup restore (a dead persisted session — e.g. backend
      // restart — should land on login without error spam).
      if (statusRef.current === 'signedIn') notifyRef.current();
      setUser(null);
      setStatus('signedOut');
    });
    return () => setSessionInvalidHandler(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tokens = await restoreTokens();
      if (!tokens) {
        if (!cancelled) setStatus('signedOut');
        return;
      }
      try {
        // Validates the persisted session; a 401 goes through the shared
        // refresh path and, if unrecoverable, the session-invalid handler.
        const me = await apiClient.me();
        if (!cancelled) {
          setUser(me);
          setStatus('signedIn');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('signedOut');
          if (isApiError(error) && error.status === 0) show(t('errorNetwork'), 'error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // Startup restore runs exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    setRememberSession(remember);
    const auth = await apiClient.login(email, password);
    setUser(auth.user);
    setStatus('signedIn');
  }, []);

  const logout = useCallback(async () => {
    await apiClient.logout();
    setUser(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout }),
    [status, user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
