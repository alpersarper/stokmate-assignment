import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from './auth/AuthContext';
import { LoginScreen } from './auth/LoginScreen';
import { LoadingState } from './components/ui';
import { useI18n } from './i18n';
import { colors, radius } from './lib/theme';
import { type RootStackParamList } from './navigation-shared';
import { ProductDetailScreen } from './products/ProductDetailScreen';
import { ProductListScreen } from './products/ProductListScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Auth-status-driven navigator (docs/ARCHITECTURE.md §4): Login and the app
 * screens are never mounted together, so signing out (or session death) resets
 * the stack — protected content is unreachable through navigation history.
 */
export function RootNavigator() {
  const { t } = useI18n();
  const { status } = useAuth();

  if (status === 'restoring') {
    return <LoadingState label={t('restoringSession')} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      {status === 'signedOut' ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen
            name="ProductList"
            component={ProductListScreen}
            options={{ title: t('productsTitle'), headerRight: () => <ListHeaderActions /> }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ title: t('productDetailTitle') }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

/** Header actions for the authenticated area: language toggle + logout (UX-007/UX-009). */
function ListHeaderActions() {
  const { locale, setLocale, t } = useI18n();
  const { logout } = useAuth();
  const nextLocale = locale === 'en' ? 'tr' : 'en';

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('language')}
        onPress={() => setLocale(nextLocale)}
        android_ripple={{ color: colors.ripple }}
        style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
      >
        <Text style={styles.chipText}>{locale.toUpperCase()}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void logout()}
        android_ripple={{ color: colors.ripple }}
        style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
      >
        <Text style={styles.chipText}>{t('logout')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: {
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  pressed: { backgroundColor: colors.surfacePressed },
});
