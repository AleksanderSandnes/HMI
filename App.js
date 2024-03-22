import { Box, GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppLayout from './app/_layout';

export default function App() {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={config}>
        <Box width="100%" justifyContent='center' alignItems='center'>
          <AppLayout />
        </Box>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}