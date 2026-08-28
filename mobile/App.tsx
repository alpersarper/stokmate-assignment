import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { LocaleProvider } from './src/i18n';
import { createQueryClient } from './src/lib/query-client';
import { RootNavigator } from './src/navigation';

const queryClient = createQueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
