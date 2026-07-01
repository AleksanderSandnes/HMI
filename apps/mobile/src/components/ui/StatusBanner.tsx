import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

import { cn } from "../../lib/cn";
import { useThemeColors, type ThemeColors } from "../../lib/theme";

export type StatusKind = "success" | "error" | "warning" | "info";

function statusConfig(
  colors: ThemeColors,
): Record<StatusKind, { className: string; color: string; icon: keyof typeof Ionicons.glyphMap }> {
  return {
    success: {
      className: "border-[rgba(52,211,153,0.33)] bg-[rgba(52,211,153,0.12)]",
      color: colors.positive,
      icon: "checkmark-circle",
    },
    error: {
      className: "border-[rgba(251,113,133,0.33)] bg-[rgba(251,113,133,0.12)]",
      color: colors.negative,
      icon: "alert-circle",
    },
    warning: {
      className: "border-[rgba(245,158,11,0.33)] bg-solar-soft",
      color: colors.solarTint,
      icon: "warning",
    },
    info: {
      className: "border-[rgba(245,158,11,0.33)] bg-solar-soft",
      color: colors.solarTint,
      icon: "information-circle",
    },
  };
}

/** Inline status banner (mirrors apps/web/components/ui/StatusBanner.tsx). */
export function StatusBanner({ kind, message }: { kind: StatusKind; message: string }) {
  const { colors } = useThemeColors();
  const { className, color, icon } = statusConfig(colors)[kind];
  return (
    <View
      className={cn(
        "mb-3.5 flex-row items-center gap-2.5 rounded-sm border px-3.5 py-2.5",
        className,
      )}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Text style={{ color }} className="flex-1 text-[13px] font-bold leading-[17px]">
        {message}
      </Text>
    </View>
  );
}

export default StatusBanner;
