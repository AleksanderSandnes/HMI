import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { premiumTheme } from '../../../theme/premiumTheme';

type Kind = 'success' | 'error' | 'info';

const CONFIG: Record<
  Kind,
  { color: string; bg: string; icon: React.ComponentProps<typeof FontAwesome5>['name'] }
> = {
  success: {
    color: premiumTheme.positive,
    bg: 'rgba(52, 211, 153, 0.12)',
    icon: 'check-circle',
  },
  error: {
    color: premiumTheme.negative,
    bg: 'rgba(251, 113, 133, 0.12)',
    icon: 'exclamation-circle',
  },
  info: {
    color: premiumTheme.solar.light,
    bg: premiumTheme.solar.soft,
    icon: 'info-circle',
  },
};

export default function StatusBanner({
  kind,
  message,
}: {
  kind: Kind;
  message: string;
}) {
  const c = CONFIG[kind];
  return (
    <View style={[styles.wrap, { backgroundColor: c.bg, borderColor: c.color + '55' }]}>
      <FontAwesome5 name={c.icon} size={13} color={c.color} solid />
      <Text style={[styles.text, { color: c.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderRadius: premiumTheme.radius.sm,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 14,
  },
  text: { fontSize: 13, fontWeight: '700', flex: 1, lineHeight: 17 },
});
