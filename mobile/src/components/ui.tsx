import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../lib/theme';

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

/** Full-area loading state (initial loads — never a blank screen, UX-004). */
export function LoadingState({ label }: { label: string }) {
  return (
    <View style={styles.stateContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.stateBody}>{label}</Text>
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
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
      >
        <Text style={styles.retryButtonText}>{retryLabel}</Text>
      </Pressable>
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
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primaryButtonPressed: { backgroundColor: colors.primaryPressed },
  primaryButtonDisabled: { backgroundColor: colors.disabledSurface },
  primaryButtonText: { color: colors.onPrimary, fontWeight: '600', fontSize: 16 },
  primaryButtonTextDisabled: { color: colors.disabledText },

  stateContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  stateTitle: { fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center' },
  stateBody: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  retryButton: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
  },
  retryButtonPressed: { backgroundColor: colors.border },
  retryButtonText: { color: colors.text, fontWeight: '600' },
});
