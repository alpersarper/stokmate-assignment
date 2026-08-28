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
import { colors, radius } from '../lib/theme';
import { useAuth } from './AuthContext';

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
          <Text style={styles.title}>{t('appTitle')}</Text>
          <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>

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
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 16,
  },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: -10 },

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
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputInvalid: { borderColor: colors.danger },
  fieldError: { color: colors.danger, fontSize: 12 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passwordInput: { flex: 1 },
  eyeButton: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 10,
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
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
  },
  languageChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  languageChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  languageChipTextActive: { color: colors.surface },
  pressed: { opacity: 0.7 },
});
