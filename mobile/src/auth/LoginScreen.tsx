import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton } from '../components/ui';
import { useI18n } from '../i18n';
import { describeFailure } from '../lib/errors';
import { colors, elevation, radius, spacing } from '../lib/theme';
import { useAuth } from './AuthContext';

/**
 * StokMate brand mark: three ascending stock bars on a primary tile.
 * Mirrors web/public/favicon.svg — plain Views, no image/icon dependency.
 */
function BrandMark() {
  return (
    <View style={styles.brandTile} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.brandBar, { height: 10 }]} />
      <View style={[styles.brandBar, { height: 17 }]} />
      <View style={[styles.brandBar, { height: 24 }]} />
    </View>
  );
}

/**
 * UX-007 login. On failure: email preserved, password cleared, clear
 * authentication error shown. Duplicate submits blocked while submitting.
 */
export function LoginScreen() {
  const { t } = useI18n();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<{ message: string; detail?: string } | null>(null);
  const passwordRef = useRef<TextInput>(null);

  async function submit() {
    if (submitting) return;
    const trimmedEmail = email.trim();
    const nextFieldErrors: typeof fieldErrors = {};
    if (!trimmedEmail) nextFieldErrors.email = t('validationEmailRequired');
    if (!password) nextFieldErrors.password = t('validationPasswordRequired');
    setFieldErrors(nextFieldErrors);
    if (nextFieldErrors.email || nextFieldErrors.password) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await login(trimmedEmail, password, remember);
      // Success: the auth-status-driven navigator swaps to the app stack.
    } catch (error) {
      const failure = describeFailure(error, 'login');
      setFormError({ message: t(failure.key), detail: failure.detail });
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <BrandMark />
            <View style={styles.brandTextBlock}>
              <Text style={styles.title}>{t('appTitle')}</Text>
              <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>
            </View>
          </View>

          {formError ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Text style={styles.errorBannerText}>{formError.message}</Text>
              {formError.detail ? (
                <Text style={styles.errorBannerDetail}>{formError.detail}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>{t('emailLabel')}</Text>
            <TextInput
              style={[styles.input, fieldErrors.email && styles.inputInvalid]}
              value={email}
              onChangeText={(next) => {
                setEmail(next);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              editable={!submitting}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              testID="login-email"
            />
            {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('passwordLabel')}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.passwordInput, fieldErrors.password && styles.inputInvalid]}
                value={password}
                onChangeText={(next) => {
                  setPassword(next);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                editable={!submitting}
                returnKeyType="done"
                onSubmitEditing={submit}
                testID="login-password"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? t('hidePassword') : t('showPassword')}
                onPress={() => setShowPassword((prev) => !prev)}
                style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
              >
                <Text style={styles.eyeButtonText}>
                  {showPassword ? t('hidePassword') : t('showPassword')}
                </Text>
              </Pressable>
            </View>
            {fieldErrors.password ? (
              <Text style={styles.fieldError}>{fieldErrors.password}</Text>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: remember }}
            onPress={() => setRemember((prev) => !prev)}
            disabled={submitting}
            style={({ pressed }) => [styles.rememberRow, pressed && styles.pressed]}
          >
            <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
              {remember ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <Text style={styles.rememberLabel}>{t('rememberMe')}</Text>
          </Pressable>

          <PrimaryButton
            label={submitting ? t('signingIn') : t('signIn')}
            onPress={submit}
            busy={submitting}
          />
        </View>

        <LanguageSwitch />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();
  return (
    <View style={styles.languageRow}>
      <Text style={styles.languageLabel}>{t('language')}:</Text>
      {(
        [
          ['en', t('languageEnglish')],
          ['tr', t('languageTurkish')],
        ] as const
      ).map(([value, label]) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          accessibilityState={{ selected: locale === value }}
          onPress={() => setLocale(value)}
          style={({ pressed }) => [
            styles.languageChip,
            locale === value && styles.languageChipActive,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[styles.languageChipText, locale === value && styles.languageChipTextActive]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    padding: spacing.xxl,
    gap: spacing.lg,
    ...elevation.card,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.xs },
  brandTile: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 13,
  },
  brandBar: { width: 6, borderRadius: 3, backgroundColor: colors.onPrimary },
  brandTextBlock: { flex: 1, gap: 2 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted },

  errorBanner: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
  },
  errorBannerText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  errorBannerDetail: { color: colors.danger, fontSize: 12 },

  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: {
    borderWidth: 1.5,
    borderColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  inputInvalid: { borderColor: colors.danger, backgroundColor: colors.dangerSurface },
  fieldError: { color: colors.danger, fontSize: 12 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  passwordInput: { flex: 1 },
  eyeButton: {
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  eyeButtonText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: colors.onPrimary, fontSize: 14, fontWeight: '700' },
  rememberLabel: { fontSize: 14, color: colors.text },

  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  languageLabel: { color: colors.textMuted, fontSize: 13 },
  languageChip: {
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceMuted,
  },
  languageChipActive: { backgroundColor: colors.text },
  languageChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  languageChipTextActive: { color: colors.surface },
  pressed: { opacity: 0.7 },
});
