import { formatKurus, isApiError } from '@stokmate/shared';
import { useState } from 'react';
import { apiClient } from '@/api/client';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';

/**
 * FOUNDATION-ONLY connectivity probe: proves the shared api-core reaches the
 * running backend from this app (login → product list → product detail).
 * The Web Agent replaces this with the real login flow. Test credentials are
 * the seeded assignment user documented in api/StokMate/README.md.
 */
export function ConnectivityProbe() {
  const { locale } = useI18n();
  const [status, setStatus] = useState<string>('idle');
  const [busy, setBusy] = useState(false);

  async function runProbe() {
    setBusy(true);
    setStatus('running…');
    try {
      const auth = await apiClient.login('test@ornek.com', 'Test1234!');
      const page = await apiClient.getProducts({ pageSize: 1 });
      const detail = await apiClient.getProduct(1);
      setStatus(
        `OK — user ${auth.user.fullName}; ${page.total} products; ` +
          `#1 "${detail.name}" ${formatKurus(detail.price, locale)}`,
      );
    } catch (error) {
      setStatus(
        isApiError(error)
          ? `FAILED — HTTP ${error.status}: ${error.message || '(empty body)'}`
          : `FAILED — ${String(error)}`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">
      <p className="mb-2 font-medium">Backend connectivity probe (foundation only)</p>
      <Button type="button" onClick={runProbe} disabled={busy}>
        Run probe
      </Button>
      <p className="mt-2 break-words" data-testid="probe-status">
        {status}
      </p>
    </div>
  );
}
