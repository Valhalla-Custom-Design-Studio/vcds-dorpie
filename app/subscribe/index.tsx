import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/theme';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { TIERS, Tier } from '@/constants/tiers';

export default function SubscribeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [lang, setLang] = useState<'af' | 'en'>('af');

  const subscribe = async (tierId: Tier) => {
    if (tierId === 'free') { router.back(); return; }
    setLoading(tierId);
    try {
      const { data } = await api.post('/payments/subscribe', { tier: tierId });
      if (data.data?.payment_url) {
        router.push({ pathname: '/payments/webview', params: { url: data.data.payment_url } });
      }
    } catch {
      Alert.alert(lang === 'af' ? 'Fout' : 'Error', lang === 'af' ? 'Kon nie inteken nie. Probeer weer.' : 'Could not subscribe. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const tierList = Object.values(TIERS);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.langRow}>
        <TouchableOpacity onPress={() => setLang('af')} style={[s.langBtn, lang === 'af' && s.langActive]}>
          <Text style={[s.langText, lang === 'af' && s.langActiveText]}>AF</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setLang('en')} style={[s.langBtn, lang === 'en' && s.langActive]}>
          <Text style={[s.langText, lang === 'en' && s.langActiveText]}>EN</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.title}>{lang === 'af' ? 'Kies Jou Plan' : 'Choose Your Plan'}</Text>
      <Text style={s.sub}>{lang === 'af' ? 'Ondersteun jou gemeenskap en kry meer toegang' : 'Support your community and unlock more access'}</Text>
      {tierList.map((tier) => (
        <View key={tier.id} style={[s.card, { borderColor: tier.color }, tier.recommended && s.recommended]}>
          {tier.recommended && (
            <View style={[s.badge, { backgroundColor: tier.color }]}>
              <Text style={s.badgeText}>{lang === 'af' ? '⭐ Gewild' : '⭐ Popular'}</Text>
            </View>
          )}
          <Text style={[s.tierName, { color: tier.color }]}>{lang === 'af' ? tier.name_af : tier.name_en}</Text>
          <Text style={s.price}>{tier.price === 0 ? (lang === 'af' ? 'Gratis' : 'Free') : `R${tier.price}/maand`}</Text>
          <Text style={s.desc}>{lang === 'af' ? tier.description_af : tier.description_en}</Text>
          {(lang === 'af' ? tier.features_af : tier.features_en).map((f) => (
            <Text key={f} style={s.feature}>✓ {f}</Text>
          ))}
          <TouchableOpacity
            style={[s.btn, { backgroundColor: tier.color }]}
            onPress={() => subscribe(tier.id)}
            disabled={loading === tier.id || user?.subscription_tier === tier.id}
          >
            {loading === tier.id ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>
                {user?.subscription_tier === tier.id
                  ? (lang === 'af' ? 'Huidige Plan' : 'Current Plan')
                  : (lang === 'af' ? 'Kies Hierdie' : 'Choose This')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  langRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12, gap: 8 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: Colors.muted },
  langActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  langText: { color: Colors.muted, fontWeight: '600', fontSize: 12 },
  langActiveText: { color: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 14, color: Colors.muted, textAlign: 'center', marginBottom: 24 },
  card: { backgroundColor: Colors.surface || '#1a1a1a', borderWidth: 2, borderRadius: 16, padding: 20, marginBottom: 16 },
  recommended: { shadowColor: '#3B82F6', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 8 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  tierName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  price: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  desc: { fontSize: 13, color: Colors.muted, marginBottom: 12, lineHeight: 18 },
  feature: { fontSize: 14, color: Colors.text, marginBottom: 4 },
  btn: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
