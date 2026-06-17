import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import { premiumTheme, glassBlur } from '../../theme/premiumTheme';

interface PremiumCalendarProps {
  visible: boolean;
  /** Selected date as an ISO `YYYY-MM-DD` string. */
  value: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
  /** Disable dates after today (no production data exists yet). */
  disableFuture?: boolean;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

const startOfDay = (d: Date) => {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
};

export default function PremiumCalendar({
  visible,
  value,
  onSelect,
  onClose,
  disableFuture = true,
}: PremiumCalendarProps) {
  const { width } = useWindowDimensions();
  const selected = startOfDay(new Date(value));
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1)
  );

  // Keep the visible month in sync when the picker is reopened on a new date.
  React.useEffect(() => {
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

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, glassBlur(6)]} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation?.()}>
          <GlassCard
            strong
            elevated
            style={[styles.sheet, { maxWidth: Math.min(380, width - 40) }]}
          >
            {/* Month navigation */}
            <View style={styles.header}>
              <Pressable
                style={styles.navBtn}
                onPress={() => shiftMonth(-1)}
                hitSlop={8}
              >
                <FontAwesome5
                  name="chevron-left"
                  size={14}
                  color={premiumTheme.text.secondary}
                />
              </Pressable>
              <Text style={styles.monthTitle}>
                {MONTHS[month]} {year}
              </Text>
              <Pressable
                style={styles.navBtn}
                onPress={() => shiftMonth(1)}
                hitSlop={8}
              >
                <FontAwesome5
                  name="chevron-right"
                  size={14}
                  color={premiumTheme.text.secondary}
                />
              </Pressable>
            </View>

            {/* Weekday labels */}
            <View style={styles.weekRow}>
              {WEEKDAYS.map((w) => (
                <View key={w} style={styles.cell}>
                  <Text style={styles.weekday}>{w}</Text>
                </View>
              ))}
            </View>

            {/* Day grid */}
            <View style={styles.grid}>
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
                      style={({ pressed }) => [
                        styles.day,
                        isToday && !isSelected && styles.dayToday,
                        pressed && !isSelected && styles.dayPressed,
                      ]}
                    >
                      {isSelected ? (
                        <LinearGradient
                          colors={premiumTheme.solar.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.daySelected}
                        >
                          <Text style={styles.daySelectedText}>{d.getDate()}</Text>
                        </LinearGradient>
                      ) : (
                        <Text
                          style={[
                            styles.dayText,
                            isFuture && styles.dayTextDisabled,
                            isToday && styles.dayTextToday,
                          ]}
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
            <View style={styles.footer}>
              <Pressable style={styles.todayBtn} onPress={() => pick(today)}>
                <Text style={styles.todayText}>Today</Text>
              </Pressable>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
          </GlassCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 16, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    width: 340,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: premiumTheme.glass.fillStrong,
    borderWidth: 1,
    borderColor: premiumTheme.glass.border,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: premiumTheme.text.primary,
  },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: {
    fontSize: 11,
    fontWeight: '700',
    color: premiumTheme.text.muted,
    letterSpacing: 0.3,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPressed: { backgroundColor: premiumTheme.glass.fillStrong },
  dayToday: {
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  daySelected: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelectedText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0a1124',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: premiumTheme.text.secondary,
  },
  dayTextToday: { color: premiumTheme.solar.light, fontWeight: '800' },
  dayTextDisabled: { color: 'rgba(255, 255, 255, 0.22)' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  todayBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: premiumTheme.radius.md,
    alignItems: 'center',
    backgroundColor: premiumTheme.solar.soft,
    borderWidth: 1,
    borderColor: premiumTheme.solar.main,
  },
  todayText: {
    fontSize: 14,
    fontWeight: '800',
    color: premiumTheme.solar.light,
  },
  closeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: premiumTheme.radius.md,
    alignItems: 'center',
    backgroundColor: premiumTheme.glass.fill,
    borderWidth: 1,
    borderColor: premiumTheme.glass.border,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
    color: premiumTheme.text.secondary,
  },
});
