import { formatKurus, isApiError } from '@stokmate/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { apiClient } from '../../api/client';
import { API_URL } from '../../lib/env';
import { useI18n } from '../../i18n';

/**
 * FOUNDATION-ONLY connectivity probe: proves the shared api-core reaches the
 * running backend from this app (login → product list → product detail).
 * The Mobile Agent replaces this with the real login flow. Test credentials are
 * the seeded assignment user documented in api/StokMate/README.md.
 */
export function ConnectivityProbe() {
  const { locale } = useI18n();
  const [status, setStatus] = useState('idle');
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
    <View style={styles.box}>
      <Text style={styles.title}>Backend connectivity probe (foundation only)</Text>
      <Text style={styles.detail}>API: {API_URL}</Text>
      <Pressable
        onPress={runProbe}
        disabled={busy}
        style={({ pressed }) => [styles.button, (pressed || busy) && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Run probe</Text>
      </Pressable>
      <Text style={styles.status} testID="probe-status">
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d4d4d4',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  title: { fontWeight: '600', color: '#404040' },
  detail: { color: '#737373', fontSize: 12 },
  button: {
    backgroundColor: '#171717',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  buttonPressed: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontWeight: '500' },
  status: { color: '#525252', fontSize: 13 },
});
