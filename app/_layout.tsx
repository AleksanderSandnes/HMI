import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppWrapper from './(redux)/AppWrapper';
import { Provider } from 'react-redux';
import { store } from './(redux)/store';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppWrapper />
      </QueryClientProvider>
    </Provider>
  );
}
