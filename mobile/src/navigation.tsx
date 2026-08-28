import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from './auth/LoginScreen';
import { useI18n } from './i18n';
import { type RootStackParamList } from './navigation-shared';
import { ProductDetailScreen } from './products/ProductDetailScreen';
import { ProductListScreen } from './products/ProductListScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { t } = useI18n();
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: t('appTitle') }} />
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ title: t('productsTitle') }}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: t('productDetailTitle') }}
      />
    </Stack.Navigator>
  );
}
