import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/lib/auth';

// Placeholder — rebuilt in Phase 5: Growatt/Weather/Account/Password cards.
// Sign-out is wired now so the auth gate can be exercised end-to-end.
export default function Settings() {
  const { signOut } = useAuth();
  return (
    <SafeAreaView className="flex-1 bg-bg-base" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-xl font-bold text-text-primary">Settings</Text>
        <Text className="mt-2 text-text-secondary">Coming in Phase 5</Text>
        <TouchableOpacity
          onPress={signOut}
          className="mt-8 rounded-pill bg-glass-fill-strong px-6 py-3"
        >
          <Text className="font-semibold text-text-primary">Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
