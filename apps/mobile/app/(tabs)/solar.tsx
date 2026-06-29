import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder — rebuilt in Phase 5: SegmentedControl + DateSelector + Skia charts.
export default function Solar() {
  return (
    <SafeAreaView className="flex-1 bg-bg-base" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-xl font-bold text-text-primary">Solar</Text>
        <Text className="mt-2 text-text-secondary">Coming in Phase 5</Text>
      </View>
    </SafeAreaView>
  );
}
