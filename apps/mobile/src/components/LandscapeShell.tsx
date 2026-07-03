import { type ReactNode } from "react";
import { ScrollView, View } from "react-native";

/**
 * Landscape chart-screen shape: chart fills the left ~2/3, controls stack in a
 * scrollable right panel (design: solar/weather side panel in landscape).
 */
export function LandscapeShell({ chart, panel }: { chart: ReactNode; panel: ReactNode }) {
  return (
    <View className="flex-1 flex-row gap-4 p-4">
      <View className="min-w-0 flex-[1.7]">{chart}</View>
      <ScrollView
        className="w-[300px] flex-none"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-4 pb-2"
      >
        {panel}
      </ScrollView>
    </View>
  );
}
