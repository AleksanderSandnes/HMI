import { Ionicons } from "@expo/vector-icons";
import {
  buildMonthGrid,
  MONTH_ABBR,
  nextZoomView,
  parseYMD,
  sameDay,
  toYMD,
  yearBlockStart,
  type CalendarView,
} from "@hmi/core";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Modal as RNModal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { cn } from "../../lib/cn";
import { GRADIENTS } from "../../lib/gradients";

import { GlassCard } from "./GlassCard";

interface CalendarProps {
  visible: boolean;
  /** Selected date as an ISO `YYYY-MM-DD` string. */
  value: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
  /** Disable dates after today (no future data). */
  disableFuture?: boolean;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const startOfDay = (d: Date) => {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
};

function Header({
  label,
  onShift,
  onZoom,
}: {
  label: string;
  onShift: (d: number) => void;
  onZoom: () => void;
}) {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <Pressable
        onPress={() => onShift(-1)}
        hitSlop={8}
        className="h-9 w-9 items-center justify-center rounded-md border border-glass-border bg-glass-fill-strong"
      >
        <Ionicons name="chevron-back" size={14} color="#aeb8cc" />
      </Pressable>
      <Pressable onPress={onZoom} hitSlop={8}>
        <Text className="text-base font-extrabold text-text-primary">{label}</Text>
      </Pressable>
      <Pressable
        onPress={() => onShift(1)}
        hitSlop={8}
        className="h-9 w-9 items-center justify-center rounded-md border border-glass-border bg-glass-fill-strong"
      >
        <Ionicons name="chevron-forward" size={14} color="#aeb8cc" />
      </Pressable>
    </View>
  );
}

function DayView({
  viewDate,
  selected,
  today,
  disableFuture,
  onPick,
}: {
  viewDate: Date;
  selected: Date;
  today: Date;
  disableFuture: boolean;
  onPick: (d: Date) => void;
}) {
  const month = viewDate.getMonth();
  return (
    <>
      <View className="mb-1.5 flex-row">
        {WEEKDAYS.map((w) => (
          <View key={w} style={styles.cell}>
            <Text className="text-[11px] font-bold tracking-[0.3px] text-text-muted">{w}</Text>
          </View>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {buildMonthGrid(viewDate).map((d) => {
          const isSel = sameDay(d, selected);
          const isFuture = disableFuture && d.getTime() > today.getTime();
          const dim = d.getMonth() !== month;
          return (
            <View key={toYMD(d)} style={styles.cell}>
              <Pressable
                disabled={isFuture}
                onPress={() => onPick(d)}
                className={cn(
                  "h-[38px] w-[38px] items-center justify-center rounded-md",
                  sameDay(d, today) && !isSel && "border border-[rgba(245,158,11,0.45)]",
                )}
              >
                {isSel ? (
                  <LinearGradient
                    colors={GRADIENTS.solar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.selected}
                  >
                    <Text className="text-sm font-extrabold text-text-inverse">{d.getDate()}</Text>
                  </LinearGradient>
                ) : (
                  <Text
                    className={cn(
                      "text-sm font-semibold",
                      isFuture || dim ? "text-[rgba(255,255,255,0.25)]" : "text-text-secondary",
                    )}
                  >
                    {d.getDate()}
                  </Text>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </>
  );
}

function PickerGrid({
  items,
  activeIndex,
  onPick,
}: {
  items: { key: string; label: string }[];
  activeIndex: number;
  onPick: (i: number) => void;
}) {
  return (
    <View className="flex-row flex-wrap">
      {items.map((it, i) => (
        <View key={it.key} style={styles.thirdCell}>
          <Pressable
            onPress={() => onPick(i)}
            className={cn(
              "h-12 items-center justify-center rounded-md border",
              i === activeIndex
                ? "border-solar bg-solar-soft"
                : "border-glass-border bg-glass-fill",
            )}
          >
            <Text
              className={cn(
                "text-sm font-bold",
                i === activeIndex ? "text-solar-light" : "text-text-secondary",
              )}
            >
              {it.label}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function useCalendarState(value: string, visible: boolean) {
  const selected = startOfDay(parseYMD(value));
  const [view, setView] = useState<CalendarView>("day");
  const [viewDate, setViewDate] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  );

  useEffect(() => {
    if (visible) {
      setView("day");
      setViewDate(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, value]);

  return { selected, view, setView, viewDate, setViewDate };
}

interface BodyProps {
  view: CalendarView;
  viewDate: Date;
  selected: Date;
  today: Date;
  disableFuture: boolean;
  month: number;
  year: number;
  blockStart: number;
  setView: (v: CalendarView) => void;
  setViewDate: (d: Date) => void;
  pick: (d: Date) => void;
}

function CalendarBody(p: BodyProps) {
  if (p.view === "day") {
    return (
      <DayView
        viewDate={p.viewDate}
        selected={p.selected}
        today={p.today}
        disableFuture={p.disableFuture}
        onPick={p.pick}
      />
    );
  }
  if (p.view === "month") {
    return (
      <PickerGrid
        items={MONTH_ABBR.map((m) => ({ key: m, label: m }))}
        activeIndex={p.month}
        onPick={(i) => {
          p.setViewDate(new Date(p.year, i, 1));
          p.setView("day");
        }}
      />
    );
  }
  return (
    <PickerGrid
      items={Array.from({ length: 12 }, (_, i) => ({
        key: `${p.blockStart + i}`,
        label: `${p.blockStart + i}`,
      }))}
      activeIndex={p.year - p.blockStart}
      onPick={(i) => {
        p.setViewDate(new Date(p.blockStart + i, p.month, 1));
        p.setView("month");
      }}
    />
  );
}

function CalendarFooter({ onToday, onClose }: { onToday: () => void; onClose: () => void }) {
  return (
    <View className="mt-4 flex-row gap-2.5">
      <Pressable
        onPress={onToday}
        className="flex-1 items-center rounded-md border border-solar bg-solar-soft py-3"
      >
        <Text className="text-sm font-extrabold text-solar-light">Today</Text>
      </Pressable>
      <Pressable
        onPress={onClose}
        className="flex-1 items-center rounded-md border border-glass-border bg-glass-fill py-3"
      >
        <Text className="text-sm font-bold text-text-secondary">Close</Text>
      </Pressable>
    </View>
  );
}

export function Calendar({
  visible,
  value,
  onSelect,
  onClose,
  disableFuture = true,
}: CalendarProps) {
  const { width } = useWindowDimensions();
  const { selected, view, setView, viewDate, setViewDate } = useCalendarState(value, visible);
  const today = startOfDay(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const blockStart = yearBlockStart(year);

  const shift = (delta: number) => {
    if (view === "day") setViewDate(new Date(year, month + delta, 1));
    else if (view === "month") setViewDate(new Date(year + delta, month, 1));
    else setViewDate(new Date(year + delta * 12, month, 1));
  };

  const pick = (d: Date) => {
    onSelect(toYMD(d));
    onClose();
  };

  const headerLabel =
    view === "day"
      ? `${MONTHS[month]} ${year}`
      : view === "month"
        ? `${year}`
        : `${blockStart}–${blockStart + 11}`;

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-center p-5">
        <BlurView
          intensity={14}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          className="bg-[rgba(4,7,16,0.7)]"
        />
        <Pressable onPress={(e) => e.stopPropagation()}>
          <GlassCard strong elevated className="p-5" style={{ width: Math.min(340, width - 40) }}>
            <Header
              label={headerLabel}
              onShift={shift}
              onZoom={() => setView(nextZoomView(view))}
            />
            <CalendarBody
              view={view}
              viewDate={viewDate}
              selected={selected}
              today={today}
              disableFuture={disableFuture}
              month={month}
              year={year}
              blockStart={blockStart}
              setView={setView}
              setViewDate={setViewDate}
              pick={pick}
            />
            <CalendarFooter onToday={() => pick(today)} onClose={onClose} />
          </GlassCard>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  thirdCell: { width: `${100 / 3}%`, padding: 5 },
  selected: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Calendar;
