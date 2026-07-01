import { Ionicons } from "@expo/vector-icons";
import { parseYMD, shiftYMD, toYMD } from "@hmi/core";
import { useState } from "react";
import { Pressable, Text } from "react-native";

import { Calendar } from "./Calendar";
import { GlassCard } from "./GlassCard";

interface DateSelectorProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  disabled?: boolean;
}

function StepButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={disabled ? { opacity: 0.4 } : undefined}
      className="h-[46px] w-[46px] items-center justify-center rounded-[14px] border border-glass-border bg-glass-fill"
    >
      <Ionicons name={icon} size={20} color="#aeb8cc" />
    </Pressable>
  );
}

/**
 * Inline date stepper (design 1d/1e): ‹ prev · calendar-button · next ›. The
 * chevrons move a day at a time (next disabled at today); the centre button opens
 * the drill-down calendar. Local-tz date math via the shared @hmi/core helpers.
 */
export function DateSelector({ selectedDate, onDateSelect, disabled = false }: DateSelectorProps) {
  const [open, setOpen] = useState(false);
  const label = parseYMD(selectedDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const atToday = selectedDate >= toYMD(new Date());

  return (
    <>
      <GlassCard strong className="flex-row items-center gap-2 p-[7px]">
        <StepButton
          icon="chevron-back"
          label="Previous day"
          disabled={disabled}
          onPress={() => onDateSelect(shiftYMD(selectedDate, -1))}
        />
        <Pressable
          disabled={disabled}
          onPress={() => setOpen(true)}
          className="h-[46px] flex-1 flex-row items-center justify-center gap-2.5 rounded-[14px] border border-glass-border bg-glass-fill"
        >
          <Ionicons name="calendar" size={16} color="#aeb8cc" />
          <Text className="text-[15px] font-extrabold text-text-primary">{label}</Text>
        </Pressable>
        <StepButton
          icon="chevron-forward"
          label="Next day"
          disabled={disabled || atToday}
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
