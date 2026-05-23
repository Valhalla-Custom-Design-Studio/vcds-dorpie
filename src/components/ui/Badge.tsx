import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '../../theme';

type Variant = 'primary' | 'success' | 'warning' | 'error' | 'muted';
interface Props { label: string; variant?: Variant; }

export function Badge({ label, variant = 'primary' }: Props) {
  const bg = variant === 'success' ? Colors.success
    : variant === 'warning' ? Colors.warning
    : variant === 'error' ? Colors.red
    : variant === 'muted' ? Colors.surface
    : Colors.primary;
  return <View style={[s.badge, { backgroundColor: bg }]}><Text style={s.text}>{label}</Text></View>;
}

const s = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '600', color: '#fff' },
});
