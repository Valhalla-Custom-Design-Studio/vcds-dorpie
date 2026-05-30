import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Radius, Shadow } from '@/theme';
import { PlatinumCard, Badge, ScreenHeader } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { subscriptionsAPI } from '@/services/api';
import { t } from '@/i18n';

const TIERS = [
  {
    id: 'free',
    nameKey: 'subscribe.free',
    price: 'R0',
    color: Colors.textMuted,
    features: [
      '✅ Gemeenskapskenmerke',
      '✅ Basiese kennisgewings',
      '✅ Markplek toegang',
      '✅ Forum & gebeure',
      '❌ SOS Noodknoppie',
      '❌ Bewakermodus™',
      '❌ LPR Kamera',
      '❌ AI Misdaadanalise',
    ],
  },
  {
    id: 'pro',
    nameKey: 'subscribe.pro',
    price: 'R99',
    color: Colors.primary,
    badgeKey: 'subscribe.popular',
    features: [
      '✅ Alles in Gratis',
      '✅ SOS Noodknoppie',
      '✅ Bewakermodus™',
      '✅ Phantom Alert™',
      '✅ Bewegings-DNA™',
      '✅ LPR Kamera',
      '✅ AI Misdaadanalise',
      '✅ Dooie Man Skakelaar',
    ],
  },
  {
    id: 'platinum',
    nameKey: 'subscribe.platinum',
    price: 'R199',
    color: Colors.accent,
    badgeKey: 'subscribe.bestValue',
    features: [
      '✅ Alles in Pro',
      '✅ GeoFence Wagposte',
      '✅ Gesigsgemoedopsporing',
      '✅ HOA Admin Paneel',
      '✅ Multi-kamera bestuur',
      '✅ Gevorderde analise',
      '✅ Prioriteit ondersteuning',
    ],
  },
];

export default function Subscribe() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState('pro');
  const [loading, setLoading] = useState(false);

  const currentTier = user?.subscription_tier || 'free';

  const handleSubscribe = async () => {
    if (selected === 'free') { router.back(); return; }
    if (selected === currentTier) { router.back(); return; }
    setLoading(true);
    try {
      const { data } = await subscriptionsAPI.create({ tier: selected });
      if (data.paymentUrl) {
        router.push({ pathname: '/payments/webview', params: { url: data.paymentUrl } });
      }
    } catch (e: any) {
      Alert.alert('Fout', e.response?.data?.message || t('subscribe.paymentFailed'));
    } finally { setLoading(false); }
  };

  const tierColor = (id: string) => {
    if (id === 'platinum') return Colors.accent;
    if (id === 'pro') return Colors.primary;
    return Colors.textMuted;
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScreenHeader title={t('subscribe.title')} showBack />
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}>
        <LinearGradient colors={[Colors.primaryDark + '80', Colors.bg]} style={s.hero}>
          <Text style={[Typography.h2, { textAlign: 'center' }]}>🛡️ Dorpwag™</Text>
          <Text style={[Typography.caption, { color: Colors.textMuted, textAlign: 'center', marginTop: 8 }]}>
            {t('subscribe.subtitle')}
          </Text>
        </LinearGradient>

        {TIERS.map(tier => {
          const isSelected = selected === tier.id;
          const isCurrent = currentTier === tier.id;
          return (
            <TouchableOpacity key={tier.id} onPress={() => setSelected(tier.id)} activeOpacity={0.85}>
              <PlatinumCard
                accentColor={isSelected ? tierColor(tier.id) : undefined}
                style={[s.tierCard, isSelected && { borderColor: tierColor(tier.id), borderWidth: 2 }]}
              >
                <View style={s.tierHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.h3, { color: tierColor(tier.id) }]}>{t(tier.nameKey)}</Text>
                    <Text style={[Typography.h2, { color: Colors.textPrimary, marginTop: 2 }]}>
                      {tier.price}<Text style={[Typography.caption, { color: Colors.textMuted }]}>{t('subscribe.perMonth')}</Text>
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    {tier.badgeKey && <Badge label={t(tier.badgeKey)} color={tierColor(tier.id)} />}
                    {isCurrent && <Badge label={t('subscribe.currentPlan')} color={Colors.accentGreen} />}
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color={tierColor(tier.id)} />}
                  </View>
                </View>
                <View style={s.divider} />
                {tier.features.map((f, i) => (
                  <Text key={i} style={[Typography.caption, s.feature]}>{f}</Text>
                ))}
              </PlatinumCard>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[s.cta, { backgroundColor: tierColor(selected), opacity: loading ? 0.7 : 1 }]}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.ctaText}>{selected === currentTier ? t('subscribe.currentPlan') : t('subscribe.subscribe')}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, gap: 12 },
  hero: { borderRadius: 16, padding: 24, marginBottom: 8, alignItems: 'center' },
  tierCard: { marginBottom: 4 },
  tierHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#ffffff15', marginBottom: 10 },
  feature: { marginBottom: 4, color: Colors.textBody },
  cta: {
    marginTop: 16, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});
