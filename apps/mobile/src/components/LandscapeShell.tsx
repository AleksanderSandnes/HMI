import { type ReactNode } from "react";
import { ScrollView, View } from "react-native";

import { cn } from "../lib/cn";

/**
 * Landscape chart-screen shape: chart fills the left ~2/3, controls stack in a
 * scrollable right panel (design: solar/weather side panel in landscape).
 * `compact` (landscape phones) tightens padding and gaps so the whole panel
 * fits the short viewport without scrolling.
 */
export function LandscapeShell({
  chart,
  panel,
  compact = false,
}: {
  chart: ReactNode;
  panel: ReactNode;
  compact?: boolean;
}) {
  return (
    <View className={cn("flex-1 flex-row", compact ? "gap-3 px-4 py-2" : "gap-4 p-4")}>
      <View className="min-w-0 flex-[1.7]">{chart}</View>
      <ScrollView
        className="w-[300px] flex-none"
        showsVerticalScrollIndicator={false}
        contentContainerClassName={compact ? "gap-2 pb-1" : "gap-4 pb-2"}
      >
        {panel}
      </ScrollView>
    </View>
  );
}
