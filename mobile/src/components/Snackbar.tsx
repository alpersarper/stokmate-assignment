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
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../lib/theme';

export type SnackbarKind = 'success' | 'error' | 'info';

interface SnackbarItem {
  id: number;
  message: string;
  /** Secondary detail line (e.g. raw backend text for unrecognized failures). */
  detail?: string;
  kind: SnackbarKind;
}

interface SnackbarContextValue {
  show: (message: string, kind?: SnackbarKind, detail?: string) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

/** Bottom snackbars (UX-004 mobile): stacked near the bottom, max 2 visible, rest queued FIFO. */
const MAX_VISIBLE = 2;
const DURATION_MS = { success: 3000, info: 3500, error: 5000 } as const;

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState<SnackbarItem[]>([]);
  const queue = useRef<SnackbarItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setVisible((current) => {
      const remaining = current.filter((item) => item.id !== id);
      const promoted = queue.current.splice(0, MAX_VISIBLE - remaining.length);
      return [...remaining, ...promoted];
    });
  }, []);

  const show = useCallback((message: string, kind: SnackbarKind = 'info', detail?: string) => {
    const item: SnackbarItem = { id: nextId.current++, message, detail, kind };
    setVisible((current) => {
      if (current.length < MAX_VISIBLE) return [...current, item];
      queue.current.push(item);
      return current;
    });
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <SnackbarHost items={visible} onDismiss={dismiss} />
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider');
  return ctx;
}

function SnackbarHost({
  items,
  onDismiss,
}: {
  items: SnackbarItem[];
  onDismiss: (id: number) => void;
}) {
  const insets = useSafeAreaInsets();
  if (items.length === 0) return null;
  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + 16 }]}>
      {items.map((item) => (
        <SnackbarToast key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

function SnackbarToast({
  item,
  onDismiss,
}: {
  item: SnackbarItem;
  onDismiss: (id: number) => void;
}) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() =>
        onDismiss(item.id),
      );
    }, DURATION_MS[item.kind]);
    return () => clearTimeout(timer);
  }, [item.id, item.kind, onDismiss, opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <Pressable
        accessibilityRole="alert"
        onPress={() => onDismiss(item.id)}
        style={[styles.toast, kindStyles[item.kind]]}
      >
        <Text style={styles.message}>{item.message}</Text>
        {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
  },
  toast: {
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  message: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  detail: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },
});

const kindStyles: Record<SnackbarKind, { backgroundColor: string }> = {
  success: { backgroundColor: colors.success },
  error: { backgroundColor: colors.danger },
  info: { backgroundColor: '#262626' },
};
