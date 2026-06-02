import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { aiCrimeAPI } from '@/services/api';

const RISK_COLOR: Record<string, string> = {
  HIGH: Colors.accentRed,
  MEDIUM: Colors.accentYellow,
  LOW: Colors.accentGreen,
};

export default function AiCrimeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await aiCrimeAPI.predictions();
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textHeading} />
        </TouchableOpacity>
        <Text style={Typography.h3}>AI Misdaadanalise</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        >
          {/* Risk Score Card */}
          {data && (
            <View style={[s.riskCard, { borderColor: RISK_COLOR[data.risk_level] + '60' }]}>
              <View style={s.riskRow}>
                <View style={[s.riskBadge, { backgroundColor: RISK_COLOR[data.risk_level] + '22' }]}>
                  <Text style={[s.riskLabel, { color: RISK_COLOR[data.risk_level] }]}>
                    {data.risk_level} RISIKO
                  </Text>
                </View>
                <Text style={[Typography.h1, { color: RISK_COLOR[data.risk_level] }]}>
                  {data.risk_score}/10
                </Text>
              </View>
              <Text style={[Typography.body, { color: Colors.textBody, marginTop: 8 }]}>
                {data.recommendation}
              </Text>
              <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 4 }]}>
                Volgende hoë risiko: {data.next_high_risk}
              </Text>
            </View>
          )}

          {/* Predictions */}
          {data?.predictions?.map((p: any, i: number) => (
            <View key={i} style={s.predCard}>
              <View style={s.predRow}>
                <Ionicons name="warning" size={18} color={Colors.accentOrange} />
                <Text style={[Typography.bodySemi, { flex: 1 }]}>{p.type}</Text>
                <Text style={[Typography.caption, { color: Colors.accentOrange }]}>
                  {p.probability}%
                </Text>
              </View>
              <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 4 }]}>
                Piek: {p.peak_time} · {p.hotspot}
              </Text>
            </View>
          ))}

          {!data && (
            <View style={s.center}>
              <Ionicons name="cloud-offline" size={48} color={Colors.textMuted} />
              <Text style={[Typography.body, { color: Colors.textMuted, marginTop: 12 }]}>
                Kon nie data laai nie. Probeer weer.
              </Text>
            </View>
          )}

          <Text style={[Typography.caption, { color: Colors.textMuted, textAlign: 'center' }]}>
            Databron: {data?.data_source || 'SAPS Misdaadstatistieke + Gemeenskapsverslae'}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  riskCard: {
    backgroundColor: Colors.surface, borderWidth: 1,
    borderRadius: Radius.lg, padding: Spacing.md,
  },
  riskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  riskBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  riskLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  predCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  predRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
