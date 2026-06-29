import { ActivityIndicator, View } from 'react-native';

/**
 * Entry route. The root AuthGate (app/_layout.tsx) redirects to `(auth)/login`
 * or `(tabs)` once the session resolves, so this only renders briefly.
 */
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-bg-base">
      <ActivityIndicator color="#f59e0b" />
    </View>
  );
}
