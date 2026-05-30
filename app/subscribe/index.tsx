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

const TIERS = [
  {
    id: 'free',
    name: 'Gratis',
    price: 'R0',
    period: '/maand',
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
    name: 'Pro',
    price: 'R99',
    period: '/maand',
    color: Colors.primary,
    badge: 'GEWILD',
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
    setLoading(true);
    try {
      const { data } = await subscriptionsAPI.create({ tier: selected });
      if (data.paymentUrl) {
        router.push({ pathname: '/payments/webview', params: { url: data.paymentUrl } });
      }
    } catch (e: any) {
      Alert.alert('Fout', e.response?.data?.message || 'Betaling kon nie verwerk word nie');
    } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScreenHeader title="Kies Jou Plan" showBack />
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}>
        <LinearGradient colors={[Colors.primaryDark + '80', Colors.bg]} style={s.hero}>
          <Text style={[Typography.h2, { textAlign: 'center' }]}>🛡️ Dorpwag™ Pro</Text>
          <Text style={[Typography.caption, { color: Colors.textMuted, textAlign: 'center', marginTop: 8 }]}>
            Volledige veiligheidsbeskerming vir jou en jou gesin
          </Text>
        </LinearGradient>

        {TIERS.map(tier => (
          <TouchableOpacity key={tier.id} onPress={() => setSelected(tier.id)}>
            <PlatinumCard
              accentColor={selected === tier.id ? tier.color : undefined}
              style={[s.tierCard, selected === tier.id && { borderColor: tier.color + '60', borderWidth: 1.5 }]}
            >
              <View style={s.tierHeader}>
                <View>
                  <Text style={Typography.h3}>{tier.name}</Text>
                  <View style={s.priceRow}>
                    <Text style={[Typography.h1, { color: tier.color }]}>{tier.price}</Text>
                    <Text style={[Typography.caption, { alignSelf: 'flex-end', marginBottom: 4 }]}>{tier.period}</Text>
                  </View>
                </View>
                <View style={s.tierRight}>
                  {tier.badge && <Badge label={tier.badge} color={tier.color} />}
                  <View style={[s.radio, { borderColor: tier.color }, selected === tier.id && { backgroundColor: tier.color }]}>
                    {selected === tier.id && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </View>
              </View>
              <View style={s.featureList}>
                {tier.features.map(f => (
                  <Text key={f} style={[Typography.bodySmall, { marginBottom: 4 }]}>{f}</Text>
                ))}
              </View>
              {currentTier === tier.id && (
                <Badge label="HUIDIGE PLAN" color={Colors.success} />
              )}
            </PlatinumCard>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[s.ctaBtn, { backgroundColor: selected === 'free' ? Colors.surface : Colors.primary }]}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={[Typography.button, { color: '#fff' }]}>
              {selected === 'free' ? 'Bly op Gratis Plan' : 'Inteken vir R99/maand'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={[Typography.caption, { textAlign: 'center', color: Colors.textMuted, marginTop: 12 }]}>
          Kanselleer enige tyd · Veilige betaling via PayFast
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
  hero: { paddingVertical: 24, paddingHorizontal: 16, borderRadius: 16, marginBottom: 20 },
  tierCard: { marginBottom: 12 },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  tierRight: { alignItems: 'flex-end', gap: 8 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  featureList: { gap: 2 },
  ctaBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
});
