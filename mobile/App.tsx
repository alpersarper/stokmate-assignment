import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { SnackbarProvider } from './src/components/Snackbar';
import { LocaleProvider } from './src/i18n';
import { createQueryClient } from './src/lib/query-client';
import { RootNavigator } from './src/navigation';

const queryClient = createQueryClient();

export default function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <SafeAreaProvider>
            <SnackbarProvider>
              <AuthProvider>
                <NavigationContainer>
                  <RootNavigator />
                  <StatusBar style="auto" />
                </NavigationContainer>
              </AuthProvider>
            </SnackbarProvider>
          </SafeAreaProvider>
        </LocaleProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
