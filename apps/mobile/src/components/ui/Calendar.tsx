import { useEffect, useState } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../../lib/cn';
import { GRADIENTS } from '../../lib/gradients';
import { GlassCard } from './GlassCard';

interface CalendarProps {
  visible: boolean;
  /** Selected date as an ISO `YYYY-MM-DD` string. */
  value: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
  /** Disable dates after today (no future production data). */
  disableFuture?: boolean;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;

const startOfDay = (d: Date) => {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function Calendar({
  visible,
  value,
  onSelect,
  onClose,
  disableFuture = true,
}: CalendarProps) {
  const { width } = useWindowDimensions();
  const selected = startOfDay(new Date(value));
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  );

  // Keep the visible month in sync when reopened on a new date.
  useEffect(() => {
    if (visible) {
      setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, value]);

  const today = startOfDay(new Date());
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const shiftMonth = (delta: number) =>
    setViewMonth(new Date(year, month + delta, 1));

  const pick = (d: Date) => {
    onSelect(toISO(d));
    onClose();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center p-5"
      >
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
          <GlassCard
            strong
            elevated
            className="p-5"
            style={{ width: Math.min(340, width - 40) }}
          >
            {/* Month navigation */}
            <View className="mb-4 flex-row items-center justify-between">
              <Pressable
                onPress={() => shiftMonth(-1)}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-md border border-glass-border bg-glass-fill-strong"
              >
                <Ionicons name="chevron-back" size={14} color="#aeb8cc" />
              </Pressable>
              <Text className="text-base font-extrabold text-text-primary">
                {MONTHS[month]} {year}
              </Text>
              <Pressable
                onPress={() => shiftMonth(1)}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-md border border-glass-border bg-glass-fill-strong"
              >
                <Ionicons name="chevron-forward" size={14} color="#aeb8cc" />
              </Pressable>
            </View>

            {/* Weekday labels */}
            <View className="mb-1.5 flex-row">
              {WEEKDAYS.map((w) => (
                <View key={w} style={styles.cell}>
                  <Text className="text-[11px] font-bold tracking-[0.3px] text-text-muted">
                    {w}
                  </Text>
                </View>
              ))}
            </View>

            {/* Day grid */}
            <View className="flex-row flex-wrap">
              {cells.map((d, i) => {
                if (!d) return <View key={`e-${i}`} style={styles.cell} />;
                const isSelected = isSameDay(d, selected);
                const isToday = isSameDay(d, today);
                const isFuture = disableFuture && d.getTime() > today.getTime();

                return (
                  <View key={toISO(d)} style={styles.cell}>
                    <Pressable
                      disabled={isFuture}
                      onPress={() => pick(d)}
                      className={cn(
                        'h-[38px] w-[38px] items-center justify-center rounded-md',
                        isToday &&
                          !isSelected &&
                          'border border-[rgba(245,158,11,0.45)]',
                      )}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={GRADIENTS.solar}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.daySelected}
                        >
                          <Text className="text-sm font-extrabold text-text-inverse">
                            {d.getDate()}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <Text
                          className={cn(
                            'text-sm font-semibold',
                            isFuture
                              ? 'text-[rgba(255,255,255,0.22)]'
                              : isToday
                                ? 'font-extrabold text-solar-light'
                                : 'text-text-secondary',
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

            {/* Footer */}
            <View className="mt-4 flex-row gap-2.5">
              <Pressable
                onPress={() => pick(today)}
                className="flex-1 items-center rounded-md border border-solar bg-solar-soft py-3"
              >
                <Text className="text-sm font-extrabold text-solar-light">
                  Today
                </Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                className="flex-1 items-center rounded-md border border-glass-border bg-glass-fill py-3"
              >
                <Text className="text-sm font-bold text-text-secondary">
                  Close
                </Text>
              </Pressable>
            </View>
          </GlassCard>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Calendar;
