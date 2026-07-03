import { Ionicons } from "@expo/vector-icons";
import { formatDayMonth, parseYMD, shiftYMD, toYMD, weekdayAbbr } from "@hmi/core";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import { cn } from "../../lib/cn";
import { useI18n } from "../../lib/i18n";
import { useThemeColors } from "../../lib/theme";

import { Calendar } from "./Calendar";
import { GlassCard } from "./GlassCard";

interface DateSelectorProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  disabled?: boolean;
  /** Shorter buttons/label (landscape phone side panels). */
  compact?: boolean;
}

function StepButton({
  icon,
  label,
  onPress,
  disabled,
  compact,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled: boolean;
  compact: boolean;
}) {
  const { colors } = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={disabled ? { opacity: 0.4 } : undefined}
      className={cn(
        "items-center justify-center rounded-[14px] border border-glass-border bg-glass-fill",
        compact ? "h-[38px] w-[38px]" : "h-[46px] w-[46px]",
      )}
    >
      <Ionicons name={icon} size={compact ? 18 : 20} color={colors.textSecondary} />
    </Pressable>
  );
}

/**
 * Inline date stepper (design 1d/1e): ‹ prev · calendar-button · next ›. The
 * chevrons move a day at a time (next disabled at today); the centre button opens
 * the drill-down calendar. Local-tz date math via the shared @hmi/core helpers.
 */
export function DateSelector({
  selectedDate,
  onDateSelect,
  disabled = false,
  compact = false,
}: DateSelectorProps) {
  const [open, setOpen] = useState(false);
  const { colors } = useThemeColors();
  const { locale, t } = useI18n();
  const selected = parseYMD(selectedDate);
  const label = `${weekdayAbbr(locale, selected.getDay())}, ${formatDayMonth(locale, selected)}, ${selected.getFullYear()}`;
  const atToday = selectedDate >= toYMD(new Date());

  return (
    <>
      <GlassCard strong className={cn("flex-row items-center gap-2", compact ? "p-1" : "p-[7px]")}>
        <StepButton
          icon="chevron-back"
          label={t("a11y.previousDay")}
          disabled={disabled}
          compact={compact}
          onPress={() => onDateSelect(shiftYMD(selectedDate, -1))}
        />
        <Pressable
          disabled={disabled}
          onPress={() => setOpen(true)}
          className={cn(
            "flex-1 flex-row items-center justify-center gap-2.5 rounded-[14px] border border-glass-border bg-glass-fill",
            compact ? "h-[38px]" : "h-[46px]",
          )}
        >
          <Ionicons name="calendar" size={16} color={colors.textSecondary} />
          <Text
            className={cn(
              "font-extrabold text-text-primary",
              compact ? "text-[13px]" : "text-[15px]",
            )}
          >
            {label}
          </Text>
        </Pressable>
        <StepButton
          icon="chevron-forward"
          label={t("a11y.nextDay")}
          disabled={disabled || atToday}
          compact={compact}
          onPress={() => onDateSelect(shiftYMD(selectedDate, 1))}
        />
      </GlassCard>

      <Calendar
        visible={open}
        value={selectedDate}
        onClose={() => setOpen(false)}
        onSelect={(iso) => {
          setOpen(false);
          onDateSelect(iso);
        }}
      />
    </>
  );
}

export default DateSelector;
