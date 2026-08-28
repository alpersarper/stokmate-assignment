import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ConnectivityProbe } from '../components/dev/ConnectivityProbe';
import { useI18n } from '../i18n';
import { LinkButton, screenStyles, type RootStackParamList } from '../navigation-shared';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

/** Placeholder — the real login form (UX-007) is Mobile Agent scope. */
export function LoginScreen({ navigation }: Props) {
  const { t } = useI18n();
  return (
    <View style={screenStyles.container}>
      <Text style={screenStyles.title}>{t('loginTitle')}</Text>
      <Text style={screenStyles.notice}>{t('placeholderNotice')}</Text>
      <ConnectivityProbe />
      <LinkButton
        label={t('openProductList')}
        onPress={() => navigation.navigate('ProductList')}
      />
      <LanguageSwitch />
    </View>
  );
}

function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();
  return (
    <View style={switchStyles.row}>
      <Text style={switchStyles.label}>{t('language')}:</Text>
      <LinkButton
        label={t('languageEnglish')}
        emphasized={locale === 'en'}
        onPress={() => setLocale('en')}
      />
      <LinkButton
        label={t('languageTurkish')}
        emphasized={locale === 'tr'}
        onPress={() => setLocale('tr')}
      />
    </View>
  );
}

const switchStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { color: '#525252' },
});
