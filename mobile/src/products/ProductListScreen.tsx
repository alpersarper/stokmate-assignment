import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { LinkButton, screenStyles, type RootStackParamList } from '../navigation-shared';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductList'>;

/** Placeholder — the real list (search, pull-to-refresh) is Mobile Agent scope. */
export function ProductListScreen({ navigation }: Props) {
  const { t } = useI18n();
  return (
    <View style={screenStyles.container}>
      <Text style={screenStyles.title}>{t('productsTitle')}</Text>
      <Text style={screenStyles.notice}>{t('placeholderNotice')}</Text>
      <LinkButton
        label={t('openProductDetail')}
        onPress={() => navigation.navigate('ProductDetail', { id: 1 })}
      />
      <LinkButton label={t('backToLogin')} onPress={() => navigation.popToTop()} />
    </View>
  );
}
