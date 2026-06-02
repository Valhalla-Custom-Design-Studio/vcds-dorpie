import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { PlatinumCard, FeatureCard, FeatureIconBadge, Badge, EmptyState, SectionHeader } from '@/components/ui';
import { reportsAPI, patrols } from '@/services/api';
import { useAuthStore } from '@/store/auth';

const { width } = Dimensions.get('window');

const FEATURE_CARDS = [
  { key: 'bewakermodus', icon: 'shield-checkmark' as const, title: 'Bewakermodus™', subtitle: 'Deurlopende agtergrondbeskerming', color: Colors.accentGreen, route: '/guardian' },
  { key: 'hittemap', icon: 'map' as const, title: 'Straat Hittemap', subtitle: 'Lewende veiligheidskaart vir jou area', color: Colors.accentRed, route: '/heatmap' },
  { key: 'bewegingsdna', icon: 'analytics' as const, title: 'Bewegings-DNA™', subtitle: 'Leer jou patrone — waarsku as iets abnormaal is', color: Colors.accentPurple, route: '/movement-checkin' },
  { key: 'phantom', icon: 'eye-off' as const, title: 'Phantom Alert™', subtitle: 'Geheime noodsnellers — niks wys op jou foon nie', color: Colors.accentViolet, route: '/phantom-alert' },
  { key: 'sosgeskiedenis', icon: 'time' as const, title: 'SOS Geskiedenis', subtitle: 'Bekyk vorige noodgevalle en bewyse', color: Colors.accentYellow, route: '/sos-evidence/history' },
  { key: 'lpr', icon: 'car' as const, title: 'LPR Kamera', subtitle: 'Nommerbord herkenning & waglyslys', color: Colors.accentBlue, route: '/lpr' },
  { key: 'ai-crime', icon: 'brain' as const, title: 'AI Misdaadanalise', subtitle: 'AI-aangedrewe misdaadvoorspelling', color: Colors.accentOrange, route: '/ai-crime' },
  { key: 'deadman', icon: 'timer' as const, title: 'Dooie Man Skakelaar', subtitle: 'Outomatiese noodsein as jy nie inskakel nie', color: Colors.accentRed, route: '/deadman-checkin' },
];

const SEVERITY_COLOR: Record<string, string> = {
  high: Colors.accentRed, medium: Colors.accentYellow, low: Colors.accentGreen,
};

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
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
    >
      {/* Hero */}
      <LinearGradient colors={[Colors.accentRed + '33', Colors.bg]} style={[s.hero, { paddingTop: insets.top + 16 }]}>
        <Text style={Typography.h1}>🛡️ Noodgevalle</Text>
        <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 4 }]}>
          {user?.town_name || 'Jou dorp'} — veiligheidssentrum
        </Text>

        {/* SOS + Patrol Quick Actions */}
        <View style={s.quickRow}>
          <TouchableOpacity style={[s.quickBtn, { backgroundColor: Colors.sosRed }]} onPress={() => router.push('/sos-active')}>
            <Ionicons name="warning" size={20} color="#fff" />
            <Text style={s.quickBtnText}>SOS Nood</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.quickBtn, { backgroundColor: Colors.accentGreen + 'CC' }]} onPress={() => router.push('/patrols')}>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
            <Text style={s.quickBtnText}>Patrollie</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.quickBtn, { backgroundColor: Colors.primary + 'CC' }]} onPress={() => router.push('/incidents/create')}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={s.quickBtnText}>Rapporteer</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={s.content}>
        {/* Feature Cards Grid */}
        <SectionHeader title="Veiligheidskenmerke" />
        <View style={s.featureGrid}>
          {FEATURE_CARDS.map(card => (
            <FeatureCard key={card.key} accentColor={card.color} onPress={() => router.push(card.route as any)} style={s.featureCard}>
              <FeatureIconBadge icon={card.icon} color={card.color} />
              <Text style={[Typography.bodySemi, { marginTop: 10, fontSize: 13 }]} numberOfLines={1}>{card.title}</Text>
              <Text style={[Typography.caption, { marginTop: 2 }]} numberOfLines={2}>{card.subtitle}</Text>
            </FeatureCard>
          ))}
        </View>

        {/* Active Patrols */}
        <View style={s.section}>
          <SectionHeader title="Aktiewe Patrollies" actionLabel="Sien Alles" onAction={() => router.push('/patrols')} />
          {patrolList.length === 0 ? (
            <EmptyState icon="shield-checkmark-outline" title="Geen aktiewe patrollies"
              subtitle="Wees die eerste om jou buurt te patrolleer"
              actionLabel="Begin Patrollie" onAction={() => router.push('/patrols')} />
          ) : (
            patrolList.map((p: any) => (
              <TouchableOpacity key={p.id} onPress={() => router.push(`/patrols/${p.id}`)}>
                <PlatinumCard accentColor={p.status === 'active' ? Colors.accentGreen : undefined} style={s.patrolCard}>
                  <View style={s.patrolRow}>
                    <View style={[s.patrolIcon, { backgroundColor: p.status === 'active' ? Colors.accentGreen + '20' : Colors.surface }]}>
                      <Ionicons name="shield-checkmark" size={22} color={p.status === 'active' ? Colors.accentGreen : Colors.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={Typography.bodySemi}>{p.name}</Text>
                      <Text style={Typography.caption}>{p.area} · {p.member_count || 0} lede</Text>
                    </View>
                    <Badge label={p.status === 'active' ? 'AKTIEF' : 'INAKTIEF'} color={p.status === 'active' ? Colors.accentGreen : Colors.textMuted} />
                  </View>
                </PlatinumCard>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Recent Reports */}
        <View style={s.section}>
          <SectionHeader title="Onlangse Verslae" actionLabel="Sien Alles" onAction={() => router.push('/incidents')} />
          {reports.length === 0 ? (
            <EmptyState icon="document-text-outline" title="Geen verslae" subtitle="Geen onlangse veiligheidsverslae nie"
              actionLabel="Rapporteer Voorval" onAction={() => router.push('/incidents/create')} />
          ) : (
            reports.map((r: any) => (
              <TouchableOpacity key={r.id} onPress={() => router.push('/incidents')}>
                <PlatinumCard accentColor={SEVERITY_COLOR[r.severity]} style={s.reportCard}>
                  <View style={s.reportRow}>
                    <View style={[s.severityDot, { backgroundColor: SEVERITY_COLOR[r.severity] || Colors.textMuted }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={Typography.bodySemi}>{r.title}</Text>
                      <Text style={Typography.caption}>{r.category} · {r.address}</Text>
                    </View>
                    <Badge label={r.severity?.toUpperCase() || 'LAAG'} color={SEVERITY_COLOR[r.severity] || Colors.textMuted} />
                  </View>
                </PlatinumCard>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* SOS Contacts CTA */}
        <TouchableOpacity onPress={() => router.push('/sos-contacts')}>
          <PlatinumCard accentColor={Colors.accentRed} style={s.sosContactsCard}>
            <View style={s.sosContactsRow}>
              <View style={[s.sosContactsIcon, { backgroundColor: Colors.accentRed + '20' }]}>
                <Ionicons name="people" size={24} color={Colors.accentRed} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={Typography.bodySemi}>SOS Kontakte</Text>
                <Text style={Typography.caption}>Bestuur jou noodkontakte</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
          </PlatinumCard>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  hero: { paddingHorizontal: 16, paddingBottom: 24 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: Radius.md },
  quickBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  featureCard: { width: (width - 32 - 10) / 2 },
  section: { marginBottom: 24 },
  patrolCard: { marginBottom: 8 },
  patrolRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  patrolIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  reportCard: { marginBottom: 8 },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  sosContactsCard: { marginBottom: 8 },
  sosContactsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sosContactsIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
