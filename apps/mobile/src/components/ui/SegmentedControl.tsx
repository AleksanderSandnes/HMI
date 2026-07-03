import type { TranslationKey } from "@hmi/core";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { cn } from "../../lib/cn";
import { GRADIENTS } from "../../lib/gradients";
import { useI18n } from "../../lib/i18n";
import { hairline, useThemeColors } from "../../lib/theme";

export interface SegmentOption {
  label: string;
  value: string;
}

const DEFAULT_OPTION_KEYS: { labelKey: TranslationKey; value: string }[] = [
  { labelKey: "timespan.hourly", value: "hourly" },
  { labelKey: "timespan.weekly", value: "weekly" },
  { labelKey: "timespan.monthly", value: "monthly" },
  { labelKey: "timespan.yearly", value: "yearly" },
  { labelKey: "timespan.fiveYear", value: "total" },
];

/**
 * iOS-style segmented control with a solar-gradient pill for the active range
 * (mirrors apps/web/components/ui/SegmentedControl.tsx).
 */
export function SegmentedControl({
  value,
  onChange,
  options,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options?: SegmentOption[];
  /** Shorter pills (landscape phone side panels). */
  compact?: boolean;
}) {
  const { mode } = useThemeColors();
  const { t } = useI18n();
  const resolved =
    options ??
    DEFAULT_OPTION_KEYS.map(({ labelKey, value: v }) => ({ label: t(labelKey), value: v }));
  return (
    <View
      className="flex-row gap-1 rounded-pill border border-glass-border p-1"
      style={{ backgroundColor: hairline(mode, 0.04) }}
    >
      {resolved.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={cn(
              "flex-1 items-center justify-center rounded-pill",
              compact ? "py-1.5" : "py-2.5",
            )}
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
                compact ? "text-[12px]" : "text-[13px]",
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
