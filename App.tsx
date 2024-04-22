import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppLayout from './app/_layout';
import { en, registerTranslation } from 'react-native-paper-dates';

registerTranslation('en', en);

function App() {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={config}>
        <AppLayout />
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}

export default App;
