import React from 'react';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { en, registerTranslation } from 'react-native-paper-dates';
import RootLayout from './app/_layout';

registerTranslation('en', en);

function App() {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={config}>
        <RootLayout />
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}

export default App;
