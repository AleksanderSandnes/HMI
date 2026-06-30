import { View } from "react-native";

import { cn } from "../../lib/cn";

/** Muted placeholder bar for loading states (mirrors web ui/Skeleton). */
export function Skeleton({ className }: { className?: string }) {
  return <View className={cn("rounded-md bg-glass-fill-strong", className)} />;
}

export default Skeleton;
