import { ActivityIndicator, Text, View } from "react-native";

import { cn } from "../../lib/cn";

/** Centered loading spinner / empty-state message for the charts. */
export function ChartMessage({ height, text }: { height?: number; text?: string }) {
  return (
    <View
      style={height ? { height } : undefined}
      className={cn("items-center justify-center", !height && "flex-1")}
    >
      {text ? (
        <Text className="text-sm font-semibold text-text-muted">{text}</Text>
      ) : (
        <ActivityIndicator color="#fbbf24" />
      )}
    </View>
  );
}

export default ChartMessage;
