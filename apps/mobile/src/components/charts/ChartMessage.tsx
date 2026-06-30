import { ActivityIndicator, Text, View } from "react-native";

/** Centered loading spinner / empty-state message for the charts. */
export function ChartMessage({ height, text }: { height: number; text?: string }) {
  return (
    <View style={{ height }} className="items-center justify-center">
      {text ? (
        <Text className="text-sm font-semibold text-text-muted">{text}</Text>
      ) : (
        <ActivityIndicator color="#fbbf24" />
      )}
    </View>
  );
}

export default ChartMessage;
