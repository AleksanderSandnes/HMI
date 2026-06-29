import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../../../theme/theme';

export type SyncStatus = 'synced' | 'pending' | 'error' | null;

const MAP = {
  synced: { color: theme.positive, icon: 'check-circle', label: 'Synced' },
  pending: { color: theme.solar.light, icon: 'clock', label: 'Pending' },
  error: { color: theme.negative, icon: 'exclamation-triangle', label: 'Sync failed' },
} as const;

export default function SyncBadge({ status }: { status: SyncStatus }) {
  if (!status) return null;
  const c = MAP[status];
  return (
    <View style={[styles.wrap, { borderColor: c.color + '55', backgroundColor: c.color + '1A' }]}>
      <FontAwesome5 name={c.icon} size={11} color={c.color} solid />
      <Text style={[styles.text, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  text: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.2 },
});
