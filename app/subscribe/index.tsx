import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/theme';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';

const TIERS = [
  { id: 'free', name: 'Gratis', price: 'R0/maand', features: ['Kennisgewings lees', 'Gemeenskap forums', 'Basiese gids'], color: Colors.muted },
  { id: 'community', name: 'Gemeenskap', price: 'R49/maand', features: ['Alles in Gratis', 'Advertensies plaas', 'Besigheid profiel', 'Prioriteit ondersteuning'], color: Colors.primary },
  { id: 'guardian', name: 'Bewaker', price: 'R99/maand', features: ['Alles in Gemeenskap', 'SOS waarskuwings', 'Dooie man incheck', 'Beweging dop', 'Hittkaart toegang'], color: Colors.accent },
];

export default function SubscribeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  const subscribe = async (tierId: string) => {
    if (tierId === 'free') { router.back(); return; }
    setLoading(tierId);
    try {
      const { data } = await api.post('/payments/subscribe', { tier: tierId });
      if (data.data?.payment_url) {
        router.push({ pathname: '/payments/webview', params: { url: data.data.payment_url } });
      }
    } catch {
      Alert.alert('Fout', 'Kon nie inteken nie. Probeer weer.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Kies Jou Plan</Text>
      <Text style={s.sub}>Ondersteun jou gemeenskap en kry meer toegang</Text>
      {TIERS.map((tier) => (
        <View key={tier.id} style={[s.card, { borderColor: tier.color }]}>
          <Text style={[s.tierName, { color: tier.color }]}>{tier.name}</Text>
          <Text style={s.price}>{tier.price}</Text>
          {tier.features.map((f) => (
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
                {user?.subscription_tier === tier.id ? 'Huidige Plan' : 'Kies Hierdie'}
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
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 14, color: Colors.muted, textAlign: 'center', marginBottom: 24 },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 2 },
  tierName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  price: { fontSize: 16, color: Colors.text, marginBottom: 12 },
  feature: { fontSize: 14, color: Colors.muted, marginBottom: 4 },
  btn: { borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
