import { LinearGradient } from "expo-linear-gradient";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { cn } from "../../lib/cn";
import { GRADIENTS } from "../../lib/gradients";
import { hairline, useThemeColors } from "../../lib/theme";

export interface SegmentOption {
  label: string;
  value: string;
}

const DEFAULT_OPTIONS: SegmentOption[] = [
  { label: "Hourly", value: "hourly" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "5-Year", value: "total" },
];

/**
 * iOS-style segmented control with a solar-gradient pill for the active range
 * (mirrors apps/web/components/ui/SegmentedControl.tsx).
 */
export function SegmentedControl({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
}: {
  value: string;
  onChange: (value: string) => void;
  options?: SegmentOption[];
}) {
  const { mode } = useThemeColors();
  return (
    <View
      className="flex-row gap-1 rounded-pill border border-glass-border p-1"
      style={{ backgroundColor: hairline(mode, 0.04) }}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className="flex-1 items-center justify-center rounded-pill py-2.5"
          >
            {active ? (
              <LinearGradient
                colors={GRADIENTS.solar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
              />
            ) : null}
            <Text
              className={cn(
                "text-[13px]",
                active ? "font-extrabold text-text-inverse" : "font-semibold text-text-muted",
              )}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default SegmentedControl;
