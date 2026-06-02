import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { PlatinumCard, ScreenHeader } from '@/components/ui';
import { t } from '@/i18n';

const CATEGORIES = [
  { key: 'all', icon: 'grid', label: 'Alles' },
  { key: 'services', icon: 'construct', label: 'Dienste' },
  { key: 'goods', icon: 'cube', label: 'Goedere' },
  { key: 'property', icon: 'home', label: 'Eiendom' },
  { key: 'vehicles', icon: 'car', label: 'Voertuie' },
  { key: 'jobs', icon: 'briefcase', label: 'Werk' },
];

export default function MarketplaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <LinearGradient
        colors={[Colors.primaryDark + '80', Colors.bg]}
        style={[s.hero, { paddingTop: insets.top + 16 }]}
      >
        <Text style={Typography.h1}>🛒 {t('tabs.marketplace')}</Text>
        <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 4 }]}>
          Koop, verkoop en ruil in jou dorp
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Category grid */}
        <View style={s.grid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={s.catCard}
              onPress={() => router.push({ pathname: '/marketplace/listings', params: { category: cat.key } })}
              activeOpacity={0.8}
            >
              <PlatinumCard style={s.catInner}>
                <Ionicons name={cat.icon as any} size={28} color={Colors.primary} />
                <Text style={[Typography.caption, { color: Colors.textPrimary, marginTop: 6, textAlign: 'center' }]}>
                  {cat.label}
                </Text>
              </PlatinumCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Messages shortcut */}
        <TouchableOpacity onPress={() => router.push('/marketplace/messages')} activeOpacity={0.85}>
          <PlatinumCard style={s.msgCard}>
            <Ionicons name="chatbubbles" size={22} color={Colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[Typography.body, { color: Colors.textPrimary, fontWeight: '600' }]}>Boodskappe</Text>
              <Text style={[Typography.caption, { color: Colors.textMuted }]}>Koper/verkoper gesprekke</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </PlatinumCard>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { paddingHorizontal: Spacing.lg, paddingBottom: 24 },
  scroll: { padding: Spacing.md, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  catCard: { width: '30%' },
  catInner: { alignItems: 'center', paddingVertical: 16 },
  msgCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
});
