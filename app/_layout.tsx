import './premiumFont';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppWrapper from './(redux)/AppWrapper';
import { Provider } from 'react-redux';
import { store } from './(redux)/store';
import { StatusBar } from 'expo-status-bar';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" backgroundColor="#070b16" />
          <AppWrapper />
        </QueryClientProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
