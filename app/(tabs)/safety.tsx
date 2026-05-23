import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../src/theme';
import { PlatinumCard, Badge } from '../../src/components/ui';
import { reportsAPI, patrols, incidentsAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth';

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

  const safetyActions = [
    { icon: 'warning', label: 'Trigger SOS', route: '/sos-active', color: Colors.red },
    { icon: 'map', label: 'Safety Heatmap', route: '/heatmap', color: Colors.primary },
    { icon: 'shield-checkmark', label: 'Patrols', route: '/patrols', color: Colors.success },
    { icon: 'document', label: 'Report Incident', route: '/incidents/create', color: Colors.warning },
    { icon: 'location', label: 'Check-In', route: '/movement-checkin', color: Colors.accent },
    { icon: 'timer', label: 'Dead Man Timer', route: '/deadman-checkin', color: Colors.error },
    { icon: 'people', label: 'Guardian', route: '/guardian', color: Colors.primaryLight },
    { icon: 'megaphone', label: 'Incidents', route: '/incidents', color: Colors.textMuted },
  ];

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
    >
      <Text style={[Typography.h1, { marginBottom: 4 }]}>🛡️ Safety Hub</Text>
      <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: 24 }]}>Monitor and respond to threats in {user?.town_name || 'your town'}</Text>

      {/* SOS Banner */}
      <TouchableOpacity onPress={() => router.push('/sos-active')} style={s.sosBanner}>
        <View style={s.sosLeft}>
          <Ionicons name="warning" size={32} color="#fff" />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>Emergency SOS</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Tap to alert community instantly</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Safety Actions Grid */}
      <View style={s.grid}>
        {safetyActions.map(item => (
          <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)} style={s.gridItem}>
            <View style={[s.gridIcon, { backgroundColor: item.color + '20', borderColor: item.color + '40' }]}>
              <Ionicons name={item.icon as any} size={26} color={item.color} />
            </View>
            <Text style={[Typography.caption, { textAlign: 'center', marginTop: 6 }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active Patrols */}
      {patrolList.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <View style={s.sectionRow}>
            <Text style={Typography.h3}>🚶 Active Patrols</Text>
            <TouchableOpacity onPress={() => router.push('/patrols')}><Text style={{ color: Colors.accent, fontSize: 14 }}>See all</Text></TouchableOpacity>
          </View>
          {patrolList.map((p: any) => (
            <TouchableOpacity key={p.id} onPress={() => router.push(`/patrols/${p.id}`)}>
              <PlatinumCard style={s.card}>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={Typography.bodySemi}>{p.name}</Text>
                    <Text style={Typography.caption}>{p.area} · {p.member_count || 0} members</Text>
                  </View>
                  <Badge label={p.status === 'active' ? 'LIVE' : 'Scheduled'} variant={p.status === 'active' ? 'success' : 'muted'} />
                </View>
              </PlatinumCard>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Reports */}
      {reports.length > 0 && (
        <View>
          <View style={s.sectionRow}>
            <Text style={Typography.h3}>📋 Recent Reports</Text>
            <TouchableOpacity onPress={() => router.push('/incidents')}><Text style={{ color: Colors.accent, fontSize: 14 }}>See all</Text></TouchableOpacity>
          </View>
          {reports.map((r: any) => (
            <PlatinumCard key={r.id} style={s.card}>
              <Text style={Typography.bodySemi} numberOfLines={1}>{r.title}</Text>
              <Text style={Typography.caption}>{r.category} · {new Date(r.created_at).toLocaleDateString('en-ZA')}</Text>
            </PlatinumCard>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  sosBanner: {
    backgroundColor: Colors.red, borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24,
  },
  sosLeft: { flexDirection: 'row', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  gridItem: { width: '22%', alignItems: 'center' },
  gridIcon: {
    width: 58, height: 58, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  card: { marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
