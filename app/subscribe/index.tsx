import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Radius, Shadow, Spacing } from '@/theme';
import { PlatinumCard, Badge, ScreenHeader } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { subscriptionsAPI, api } from '@/services/api';
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
  const { user, setUser } = useAuthStore();
  const [selected, setSelected] = useState('pro');
  const [loading, setLoading] = useState(false);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState(false);

  const currentTier = user?.subscription_tier || 'free';

  const tierColor = (id: string) => {
    if (id === 'platinum') return Colors.accent;
    if (id === 'pro') return Colors.primary;
    return Colors.textMuted;
  };

  const handlePromoRedeem = async () => {
    const code = promoCode.trim();
    if (!code) {
      Alert.alert('Fout', 'Voer asseblief 'n promosiekode in.');
      return;
    }
    if (!user?.town_id) {
      Alert.alert('Fout', 'Jou dorp is nie gestel nie. Gaan na Profiel en stel jou dorp eers.');
      return;
    }
    setPromoLoading(true);
    try {
      const { data } = await api.post('/promo/redeem', { code, townId: user.town_id });
      if (data.success) {
        setPromoSuccess(true);
        // Update local user tier
        if (setUser && user) {
          setUser({ ...user, subscription_tier: data.tier });
        }
        Alert.alert(
          '🎉 Welkom by Jordaanpark!',
          data.message + '\n\nJou toegang is geldig tot 30 Junie 2026.',
          [{ text: 'Dankie!', onPress: () => router.back() }]
        );
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Ongeldige kode. Probeer weer.';
      Alert.alert('Kode Ongeldig', msg);
    } finally {
      setPromoLoading(false);
    }
  };

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

        {/* ── Promo Code Section ─────────────────────────────────────── */}
        <PlatinumCard style={s.promoCard}>
          <View style={s.promoHeader}>
            <Ionicons name="ticket" size={20} color={Colors.accentGreen} />
            <Text style={[Typography.body, { color: Colors.textPrimary, fontWeight: '700', marginLeft: 8 }]}>
              Het jy 'n promosiekode?
            </Text>
          </View>
          <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: 12 }]}>
            Jordaanpark-inwoners: gebruik kode <Text style={{ color: Colors.accentGreen, fontWeight: '700' }}>#JPF2026</Text> vir gratis toegang tot 30 Junie 2026.
          </Text>
          {promoSuccess ? (
            <View style={s.promoSuccessRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.accentGreen} />
              <Text style={[Typography.caption, { color: Colors.accentGreen, marginLeft: 8, fontWeight: '600' }]}>
                Kode suksesvol toegepas!
              </Text>
            </View>
          ) : (
            <View style={s.promoRow}>
              <TextInput
                style={s.promoInput}
                value={promoCode}
                onChangeText={setPromoCode}
                placeholder="#JPF2026"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[s.promoBtn, { opacity: promoLoading ? 0.7 : 1 }]}
                onPress={handlePromoRedeem}
                disabled={promoLoading}
              >
                {promoLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.promoBtnText}>Gebruik</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </PlatinumCard>

        {/* ── Tier Cards ─────────────────────────────────────────────── */}
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
  promoCard: { marginBottom: 4 },
  promoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  promoRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  promoInput: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.surfaceBorder, fontSize: 14, fontWeight: '600',
    letterSpacing: 1,
  },
  promoBtn: {
    backgroundColor: Colors.accentGreen, borderRadius: Radius.md,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  promoBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  promoSuccessRow: { flexDirection: 'row', alignItems: 'center' },
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
