import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useI18n } from '../i18n';
import { screenStyles, type RootStackParamList } from '../navigation-shared';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

/** Placeholder — the real detail + stock editor (UX-005) is Mobile Agent scope. */
export function ProductDetailScreen({ route }: Props) {
  const { t } = useI18n();
  return (
    <View style={screenStyles.container}>
      <Text style={screenStyles.title}>
        {t('productDetailTitle')} #{route.params.id}
      </Text>
      <Text style={screenStyles.notice}>{t('placeholderNotice')}</Text>
    </View>
  );
}
