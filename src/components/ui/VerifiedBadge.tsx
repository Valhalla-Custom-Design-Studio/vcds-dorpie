import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../../theme';

type BadgeType = 'verified' | 'premium_partner' | 'none';

interface Props {
  badge: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const CONFIG = {
  verified: {
    icon: 'checkmark-circle' as const,
    color: Colors.primary,
    label: 'Geverifieer',
    bg: 'rgba(99,102,241,0.15)',
    border: Colors.primary,
  },
  premium_partner: {
    icon: 'star' as const,
    color: '#FFD700',
    label: 'Premium Vennoot',
    bg: 'rgba(255,215,0,0.12)',
    border: '#FFD700',
  },
  none: {
    icon: 'ellipse-outline' as const,
    color: Colors.textMuted,
    label: '',
    bg: 'transparent',
    border: 'transparent',
  },
};

export function VerifiedBadge({ badge, size = 'md', showLabel = false }: Props) {
  if (badge === 'none') return null;
  const cfg = CONFIG[badge];
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;
  const fontSize = size === 'sm' ? 10 : size === 'lg' ? 14 : 12;

  return (
    <View style={[s.wrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Ionicons name={cfg.icon} size={iconSize} color={cfg.color} />
      {showLabel && <Text style={[s.label, { color: cfg.color, fontSize }]}>{cfg.label}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: { fontWeight: '600' },
});
