import { useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, elevation, radius, spacing } from '../lib/theme';

export function PrimaryButton({
  label,
  onPress,
  disabled,
  busy,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
}) {
  const blocked = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!blocked, busy: !!busy }}
      onPress={onPress}
      disabled={blocked}
      android_ripple={blocked ? undefined : { color: 'rgba(255,255,255,0.18)' }}
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && !blocked && styles.primaryButtonPressed,
        blocked && styles.primaryButtonDisabled,
      ]}
    >
      {busy ? <ActivityIndicator size="small" color={colors.onPrimary} /> : null}
      <Text style={[styles.primaryButtonText, blocked && styles.primaryButtonTextDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Tonal secondary button — filled neutral surface, no outline. The shared
 * secondary-action treatment (sheet footers, empty-state recovery, retry).
 */
export function TonalButton({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      android_ripple={{ color: colors.ripple }}
      style={({ pressed }) => [styles.tonalButton, pressed && styles.tonalButtonPressed]}
    >
      <Text style={styles.tonalButtonText}>{label}</Text>
    </Pressable>
  );
}

/** Full-area loading state (initial loads — never a blank screen, UX-004). */
export function LoadingState({ label }: { label: string }) {
  return (
    <View style={styles.stateContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.stateBody}>{label}</Text>
    </View>
  );
}

/** True while the OS reduce-motion preference is enabled. */
export function useReduceMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

/**
 * Structured initial-load skeleton for list screens (UX-004): ghost rows in
 * the real row silhouette. The gentle pulse is disabled under reduce-motion.
 */
export function SkeletonList({ rows = 7 }: { rows?: number }) {
  const reduceMotion = useReduceMotion();
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  return (
    <View style={styles.skeletonContainer} accessibilityElementsHidden>
      {Array.from({ length: rows }, (_, index) => (
        <Animated.View key={index} style={[styles.skeletonRow, { opacity: pulse }]}>
          <View style={styles.skeletonMain}>
            <View style={[styles.skeletonBar, { width: '72%' }]} />
            <View style={[styles.skeletonBar, styles.skeletonBarThin, { width: '48%' }]} />
          </View>
          <View style={styles.skeletonSide}>
            <View style={[styles.skeletonBar, { width: 40 }]} />
            <View style={[styles.skeletonBar, styles.skeletonBarThin, { width: 56 }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

/** Full-area error state with a retry action (UX-004). */
export function ErrorState({
  title,
  detail,
  retryLabel,
  onRetry,
}: {
  title: string;
  detail?: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.stateContainer}>
      <Text style={styles.stateTitle}>{title}</Text>
      {detail ? <Text style={styles.stateBody}>{detail}</Text> : null}
      <View style={styles.stateAction}>
        <TonalButton label={retryLabel} onPress={onRetry} />
      </View>
    </View>
  );
}

/** Empty / no-results state; `action` is an optional recovery control. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.stateContainer}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateBody}>{body}</Text>
      {action ? <View style={styles.stateAction}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md + 2,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    overflow: 'hidden',
  },
  primaryButtonPressed: { backgroundColor: colors.primaryPressed },
  primaryButtonDisabled: { backgroundColor: colors.disabledSurface },
  primaryButtonText: {
    color: colors.onPrimary,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  primaryButtonTextDisabled: { color: colors.disabledText },

  tonalButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  tonalButtonPressed: { backgroundColor: colors.surfacePressed },
  tonalButtonText: { color: colors.text, fontWeight: '600', fontSize: 14 },

  stateContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: spacing.sm,
  },
  stateTitle: { fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center' },
  stateBody: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  stateAction: { marginTop: spacing.sm },

  skeletonContainer: { padding: spacing.lg, gap: 10 },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md + 2,
    paddingVertical: 14,
    paddingHorizontal: 14,
    ...elevation.card,
  },
  skeletonMain: { gap: spacing.sm, flex: 1 },
  skeletonSide: { gap: spacing.sm, alignItems: 'flex-end', width: 72 },
  skeletonBar: { height: 12, borderRadius: 6, backgroundColor: colors.skeleton },
  skeletonBarThin: { height: 9 },
});
