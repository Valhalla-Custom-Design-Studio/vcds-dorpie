import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { PlatinumCard, FeatureCard, FeatureIconBadge, Badge, EmptyState } from '@/components/ui';
import { reportsAPI, patrols } from '@/services/api';
import { useAuthStore } from '@/store/auth';

const FEATURE_CARDS = [
  {
    key: 'bewakermodus',    icon: 'shield-checkmark' as const,
    title: 'Bewakermodus™',
    subtitle: 'Deurlopende agtergrondbeskerming',
    color: Colors.accentGreen,
    route: '/guardian',
  },
  {
    key: 'hittemap',
    icon: 'map' as const,
    title: 'Straat Hittemap•',
    subtitle: 'Lewende veiligheidskaart vir jou area',
    color: Colors.accentRed,
    route: '/heatmap',
  },
  {
    key: 'bewegingsdna',
    icon: 'analytics' as const,
    title: 'Bewegings-DNA™',
    subtitle: 'Leer jou patrone — waarsku as iets abnormaal is',
    color: Colors.accentPurple,
    route: '/movement-checkin',
  },
  {
    key: 'phantom',
    icon: 'eye-off' as const,
    title: 'Phantom Alert™',
    subtitle: 'Geheime noodsnellers — niks wys op jou foon nie',
    color: Colors.accentViolet,
    route: '/sos-active',
  },
  {
    key: 'sosgeskiedenis',
    icon: 'time' as const,
    title: 'SOS Geskiedenis',
    subtitle: 'Bekyk vorige noodgevalle en bewyse',
    color: Colors.accentYellow,
    route: '/sos-evidence/history',
  },
];

export default function Safety() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const [reports, setReports] = useState<any[]>([]);
  const [patrolList, setPatrolList] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [r, p] = await Promise.allSettled([reportsAPI.list(), patrols.list()]);
      if (r.status === 'fulfilled') setReports(r.value.data.data?.slice(0, 5) || []);
      if (p.status === 'fulfilled') setPatrolList(p.value.data.data?.slice(0, 3) || []);
    } finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40, paddingHorizontal: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
    >
      <Text style={[Typography.h1, { marginBottom: 4 }]}>Noodgevalle</Text>
      <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: 24 }]}>
        {user?.town_name || 'Jou dorp'} — veiligheidssentrum
      </Text>

      {/* Quick action buttons */}
      <View style={s.quickRow}>
        <TouchableOpacity
          onPress={() => router.push('/sos-active')}
          style={[s.sosBtn, Shadow.glow(Colors.sosRed)]}
        >
          <Ionicons name="warning" size={20} color="#fff" />
          <Text style={s.sosBtnText}>SOS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/incidents/create')}
          style={[s.quickBtn, { borderColor: Colors.accentOrange + '55' }]}
        >
          <Ionicons name="document-text" size={18} color={Colors.accentOrange} />
          <Text style={[s.quickBtnText, { color: Colors.accentOrange }]}>Rapporteer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/patrols')}
          style={[s.quickBtn, { borderColor: Colors.accentGreen + '55' }]}
        >
          <Ionicons name="shield" size={18} color={Colors.accentGreen} />
          <Text style={[s.quickBtnText, { color: Colors.accentGreen }]}>Patrollie</Text>
        </TouchableOpacity>
      </View>

      {/* Feature Cards */}
      <Text style={[Typography.label, { marginBottom: 12, marginTop: 8 }]}>Veiligheidskenmerke</Text>
      {FEATURE_CARDS.map(card => (
        <FeatureCard key={card.key} accentColor={card.color} onPress={() => router.push(card.route as any)}>
          <View style={s.featureRow}>
            <FeatureIconBadge icon={card.icon} color={card.color} size={22} />
            <View style={s.featureText}>
              <Text style={[Typography.h4, { color: card.color }]}>{card.title}</Text>
              <Text style={[Typography.bodySmall, { color: Colors.textMuted, marginTop: 2 }]}>{card.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </View>
        </FeatureCard>
      ))}

      {/* Emergency contacts */}
      <Text style={[Typography.label, { marginBottom: 12, marginTop: 16 }]}>Noodkontakte</Text>
      <View style={s.contactRow}>
        {[
          { label: 'Polisie', number: '10111', icon: 'shield' as const, color: Colors.accentYellow },
          { label: 'Ambulans', number: '10177', icon: 'medical' as const, color: Colors.accentBlue },
          { label: 'Brand', number: '10177', icon: 'flame' as const, color: Colors.accentOrange },
        ].map(c => (
          <View key={c.label} style={[s.contactCard, { borderColor: c.color + '33' }]}>
            <Ionicons name={c.icon} size={22} color={c.color} />
            <Text style={[s.contactLabel, { color: c.color }]}>{c.label}</Text>
            <Text style={s.contactNumber}>{c.number}</Text>
          </View>
        ))}
      </View>

      {/* Recent incidents */}
      {reports.length > 0 && (
        <>
          <Text style={[Typography.label, { marginBottom: 12, marginTop: 16 }]}>Onlangse Voorvalle</Text>
          {reports.map(r => (
            <PlatinumCard key={r.id} onPress={() => router.push(`/incidents/${r.id}` as any)}>
              <View style={s.incidentRow}>
                <Badge label={r.category || 'Incident'} variant={r.severity === 'high' ? 'error' : r.severity === 'medium' ? 'warning' : 'muted'} />
                <Text style={[Typography.bodySmall, { flex: 1, marginLeft: 8 }]} numberOfLines={1}>{r.description}</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </View>
            </PlatinumCard>
          ))}
        </>
        )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  sosBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.sosRed, borderRadius: Radius.lg, paddingVertical: 14, gap: 6,
  },
  sosBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg, paddingVertical: 14,
    borderWidth: 1, gap: 6,
  },
  quickBtnText: { fontWeight: '700', fontSize: 13 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { flex: 1 },
  contactRow: { flexDirection: 'row', gap: 10 },
  contactCard: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, gap: 4,
  },
  contactLabel: { fontSize: 11, fontWeight: '700' },
  contactNumber: { fontSize: 13, fontWeight: '800', color: Colors.textHeading },
  incidentRow: { flexDirection: 'row', alignItems: 'center' },
});
