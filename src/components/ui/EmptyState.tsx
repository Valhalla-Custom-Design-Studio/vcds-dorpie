import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';
import { PlatinumButton } from './PlatinumButton';

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
      <Ionicons name={icon} size={56} color={Colors.textMuted} style={{ marginBottom: 16 }} />
      <Text style={Typography.h2}>{title}</Text>
      {subtitle ? <Text style={[Typography.body, { textAlign: 'center', marginTop: 8 }]}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <PlatinumButton label={actionLabel} onPress={onAction} style={{ marginTop: 24 }} />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});
