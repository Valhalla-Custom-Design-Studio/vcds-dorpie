import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function PlatinumButton({ label, onPress, loading, disabled, variant = 'primary', style, icon }: Props) {
  const bg = variant === 'primary' ? Colors.primary
    : variant === 'secondary' ? Colors.accent
    : variant === 'danger' ? Colors.red
    : 'transparent';
  const border = variant === 'ghost' ? { borderWidth: 1, borderColor: Colors.surfaceBorder } : {};
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[s.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }, border, style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          {icon}
          <Text style={[Typography.button, { color: variant === 'secondary' ? Colors.textOnAccent : '#fff', marginLeft: icon ? 8 : 0 }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radius.lg,
    minHeight: 52,
  },
});
