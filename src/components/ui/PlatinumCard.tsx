import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  accentColor?: string;
  accent?: boolean;
}

export function PlatinumCard({ children, style, onPress, accentColor, accent }: Props) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const glowStyle = accentColor ? Shadow.glow(accentColor) : {};
  const borderStyle = accentColor ? { borderColor: accentColor + '33' } : {};
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.85}
      style={[s.card, accent && s.accent, borderStyle, glowStyle, style]}
    >
      {children}
    </Wrapper>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
    marginBottom: 8,
    ...Shadow.card,
  },
  accent: {
    borderColor: Colors.primaryLight + '44',
    backgroundColor: Colors.cardGradientStart,
  },
});
