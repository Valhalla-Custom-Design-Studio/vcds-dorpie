import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow } from '../../theme';

interface Props { children: React.ReactNode; style?: ViewStyle; }

export function PlatinumCard({ children, style }: Props) {
  return <View style={[s.card, style]}>{children}</View>;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
    ...Shadow.card,
  },
});
