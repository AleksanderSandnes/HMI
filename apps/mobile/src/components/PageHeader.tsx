import type { ReactNode } from "react";
import { View, Text } from "react-native";

/**
 * Standard screen header: title + subtitle with an optional right slot.
 * `compact` (landscape phone side panels) shrinks the type so the panel fits
 * the short viewport.
 */
export function PageHeader({
  title,
  subtitle,
  right,
  compact = false,
}: {
  title: string;
  subtitle: string;
  right?: ReactNode;
  compact?: boolean;
}) {
  return (
    <View className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text
            className={
              compact
                ? "text-[18px] font-extrabold tracking-[-0.4px] text-text-primary"
                : "text-[26px] font-extrabold tracking-[-0.6px] text-text-primary"
            }
          >
            {title}
          </Text>
          <Text
            className={
              compact
                ? "mt-0.5 text-[11.5px] font-medium text-text-muted"
                : "mt-1 text-[13.5px] font-medium text-text-muted"
            }
          >
            {subtitle}
          </Text>
        </View>
      </View>
      {right}
    </View>
  );
}

export default PageHeader;
