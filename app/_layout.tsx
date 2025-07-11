import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppWrapper from './(redux)/AppWrapper';
import { Provider } from 'react-redux';
import { store } from './(redux)/store';
import { StatusBar } from 'expo-status-bar';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor="#1e3a8a" />
        <AppWrapper />
      </QueryClientProvider>
    </Provider>
  );
}
