import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import GlassCard from './GlassCard';
import PremiumCalendar from './PremiumCalendar';
import { premiumTheme, glassBlur } from '../../theme/premiumTheme';

interface PremiumDateSelectorProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  disabled?: boolean;
}

const QUICK = [
  { label: 'Today', daysAgo: 0 },
  { label: 'Yesterday', daysAgo: 1 },
  { label: '7d ago', daysAgo: 7 },
  { label: '30d ago', daysAgo: 30 },
];

const toISO = (d: Date) => d.toISOString().split('T')[0];

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerText: { flex: 1 },
  relative: {
    fontSize: 16,
    fontWeight: '800',
    color: premiumTheme.text.primary,
  },
  absolute: {
    fontSize: 12.5,
    color: premiumTheme.text.muted,
    marginTop: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 7, 16, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    padding: 22,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: premiumTheme.text.primary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: premiumTheme.glass.fillStrong,
    borderWidth: 1,
    borderColor: premiumTheme.glass.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: premiumTheme.text.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  quickBtn: {
    flexGrow: 1,
    flexBasis: '40%',
    paddingVertical: 13,
    borderRadius: premiumTheme.radius.md,
    alignItems: 'center',
    backgroundColor: premiumTheme.glass.fill,
    borderWidth: 1,
    borderColor: premiumTheme.glass.border,
  },
  quickBtnActive: {
    backgroundColor: premiumTheme.solar.soft,
    borderColor: premiumTheme.solar.main,
  },
  quickText: {
    fontSize: 14,
    fontWeight: '700',
    color: premiumTheme.text.secondary,
  },
  quickTextActive: { color: premiumTheme.solar.light },
  customBtn: {
    borderRadius: premiumTheme.radius.md,
    overflow: 'hidden',
  },
  customInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
  },
  customText: {
    fontSize: 15,
    fontWeight: '800',
    color: premiumTheme.text.inverse,
  },
});

export default function PremiumDateSelector({
  selectedDate,
  onDateSelect,
  disabled = false,
}: PremiumDateSelectorProps) {
  const { width } = useWindowDimensions();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedObj = new Date(selectedDate);

  const relative = (() => {
    const diff = Math.floor(
      (Date.now() - selectedObj.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff > 1 && diff <= 7) return `${diff} days ago`;
    return selectedObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  })();

  const absolute = selectedObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pickQuick = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    onDateSelect(toISO(d));
    setSheetOpen(false);
  };

  const isQuickActive = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return toISO(d) === selectedDate;
  };

  return (
    <>
      <GlassCard strong>
        <Pressable
          style={styles.trigger}
          onPress={() => setSheetOpen(true)}
          disabled={disabled}
        >
          <LinearGradient
            colors={premiumTheme.accent.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconWrap}
          >
            <FontAwesome5 name="calendar-alt" size={18} color="#0a1124" solid />
          </LinearGradient>
          <View style={styles.triggerText}>
            <Text style={styles.relative}>{relative}</Text>
            <Text style={styles.absolute}>{absolute}</Text>
          </View>
          <FontAwesome5
            name="chevron-down"
            size={14}
            color={premiumTheme.text.muted}
          />
        </Pressable>
      </GlassCard>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSheetOpen(false)}
      >
        <View style={[styles.overlay, glassBlur(6)]}>
          <GlassCard strong elevated style={[styles.sheet, { maxWidth: Math.min(420, width - 48) }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select date</Text>
              <Pressable
                style={styles.closeBtn}
                onPress={() => setSheetOpen(false)}
              >
                <FontAwesome5
                  name="times"
                  size={15}
                  color={premiumTheme.text.secondary}
                />
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>Quick select</Text>
            <View style={styles.quickGrid}>
              {QUICK.map((q) => {
                const act = isQuickActive(q.daysAgo);
                return (
                  <Pressable
                    key={q.label}
                    style={[styles.quickBtn, act && styles.quickBtnActive]}
                    onPress={() => pickQuick(q.daysAgo)}
                  >
                    <Text style={[styles.quickText, act && styles.quickTextActive]}>
                      {q.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Custom</Text>
            <Pressable
              style={styles.customBtn}
              onPress={() => {
                setSheetOpen(false);
                setPickerOpen(true);
              }}
            >
              <LinearGradient
                colors={premiumTheme.solar.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.customInner}
              >
                <FontAwesome5 name="calendar-day" size={15} color="#0a1124" solid />
                <Text style={styles.customText}>Pick a custom date</Text>
              </LinearGradient>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>

      <PremiumCalendar
        visible={pickerOpen}
        value={selectedDate}
        onClose={() => setPickerOpen(false)}
        onSelect={(iso) => {
          setPickerOpen(false);
          onDateSelect(iso);
        }}
      />
    </>
  );
}
