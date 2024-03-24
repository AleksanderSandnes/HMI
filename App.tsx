import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppLayout from './app/_layout';

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={config}>
        <AppLayout />
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}

export default App;