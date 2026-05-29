import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Shadow } from '../../theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'folder-open-outline', title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}>
        <Ionicons name={icon} size={40} color={Colors.textMuted} />
      </View>
      <Text style={[Typography.h3, { textAlign: 'center', marginTop: 16 }]}>{title}</Text>
      {subtitle ? <Text style={[Typography.body, { textAlign: 'center', marginTop: 8, color: Colors.textMuted }]}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} style={s.btn}>
          <Text style={s.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, minHeight: 300 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  btn: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 12, paddingHorizontal: 28,
    borderRadius: Radius.lg,
    ...Shadow.glow(Colors.primary),
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
