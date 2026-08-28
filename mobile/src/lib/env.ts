import { Platform } from 'react-native';

/**
 * Resolve the API base URL (docs/ARCHITECTURE.md §9).
 *
 * EXPO_PUBLIC_API_URL is the single configurable source; when unset:
 * - Android emulator: 10.0.2.2 is the host loopback. Android "localhost" is the
 *   device itself, NEVER the dev machine — do not "fix" this to localhost.
 * - iOS simulator / everything else: localhost works.
 * Physical devices and APK builds must set EXPO_PUBLIC_API_URL to the dev
 * machine's LAN address at start/build time.
 */
export function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'android') return 'http://10.0.2.2:5080';
  return 'http://localhost:5080';
}

export const API_URL: string = resolveApiUrl();
