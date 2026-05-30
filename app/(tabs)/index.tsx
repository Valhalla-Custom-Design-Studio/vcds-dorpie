import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { PlatinumCard, Badge, EmptyState, SectionHeader, FilterPill } from '@/components/ui';
import { noticesAPI, emergencyAlertsAPI, eventsAPI, reportsAPI } from '@/services/api';
import { useAuthStore } from '@/store/auth';

const { width } = Dimensions.get('window');

const SEVERITY_COLOR: Record<string, string> = {
  critical: Colors.accentRed,
  high: Colors.accentOrange,
  medium: Colors.accentYellow,
  low: Colors.accentGreen,
};

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const [notices, setNotices] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [n, a, e, i] = await Promise.allSettled([
        noticesAPI.list({ page: 1 }),
        emergencyAlertsAPI.list(),
        eventsAPI.list({ page: 1 }),
        reportsAPI.list(),
      ]);
      if (n.status === 'fulfilled') setNotices(n.value.data.data?.slice(0, 5) || []);
      if (a.status === 'fulfilled') setAlerts(a.value.data.data?.slice(0, 3) || []);
      if (e.status === 'fulfilled') setEvents(e.value.data.data?.slice(0, 3) || []);
      if (i.status === 'fulfilled') setIncidents(i.value.data.data?.slice(0, 3) || []);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Goeie môre';
    if (h < 17) return 'Goeie middag';
    return 'Goeie naand';
  };

  if (loading) return (
    <View style={[s.center, { paddingTop: insets.top }]}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
    >
      {/* Hero Header */}
      <LinearGradient
        colors={[Colors.primaryDark + 'CC', Colors.bg]}
        style={[s.hero, { paddingTop: insets.top + 16 }]}
      >
        <View style={s.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={[Typography.caption, { color: Colors.textMuted }]}>{greeting()},</Text>
            <Text style={Typography.h1}>{user?.name?.split(' ')[0] || 'Inwoner'} 👋</Text>
            {user?.town_name ? (
              <View style={s.townRow}>
                <Ionicons name="location" size={12} color={Colors.accent} />
                <Text style={[Typography.caption, { color: Colors.accent, marginLeft: 4 }]}>{user.town_name}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => router.push('/sos-active')} style={s.sosBtn}>
            <LinearGradient colors={[Colors.sosRed, Colors.sosRedDark]} style={s.sosBtnInner}>
              <Ionicons name="warning" size={18} color="#fff" />
              <Text style={s.sosBtnText}>SOS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Voorvalle', value: incidents.length, icon: 'shield-outline', color: Colors.accentRed },
            { label: 'Kennisgewings', value: notices.length, icon: 'document-text-outline', color: Colors.primary },
            { label: 'Gebeure', value: events.length, icon: 'calendar-outline', color: Colors.accent },
          ].map(stat => (
            <View key={stat.label} style={s.statItem}>
              <Ionicons name={stat.icon as any} size={16} color={stat.color} />
              <Text style={[Typography.h3, { color: stat.color }]}>{stat.value}</Text>
              <Text style={Typography.caption}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={s.content}>
        {/* Active Alerts */}
        {alerts.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="🚨 Aktiewe Waarskuwings" />
            {alerts.map((alert: any) => (
              <PlatinumCard key={alert.id} accentColor={SEVERITY_COLOR[alert.severity] || Colors.accentRed} style={s.alertCard}>
                <View style={s.alertRow}>
                  <View style={[s.alertDot, { backgroundColor: SEVERITY_COLOR[alert.severity] || Colors.accentRed }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={Typography.bodySemi}>{alert.title}</Text>
                    <Text style={Typography.caption}>{alert.area || alert.address}</Text>
                  </View>
                  <Badge label={alert.severity?.toUpperCase() || 'ALERT'} color={SEVERITY_COLOR[alert.severity] || Colors.accentRed} />
                </View>
              </PlatinumCard>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={s.section}>
          <SectionHeader title="Vinnige Aksies" />
          <View style={s.quickGrid}>
            {[
              { icon: 'shield-checkmark', label: 'Noodgevalle', route: '/(tabs)/safety', color: Colors.accentGreen },
              { icon: 'people', label: 'Gemeenskap', route: '/(tabs)/community', color: Colors.primary },
              { icon: 'car', label: 'LPR', route: '/lpr', color: Colors.accentBlue },
              { icon: 'analytics', label: 'AI Misdaad', route: '/ai-crime', color: Colors.accentPurple },
              { icon: 'map', label: 'Hittemap', route: '/heatmap', color: Colors.accentRed },
              { icon: 'shield', label: 'Patrollies', route: '/patrols', color: Colors.accentOrange },
            ].map(item => (
              <TouchableOpacity key={item.label} style={s.quickItem} onPress={() => router.push(item.route as any)}>
                <View style={[s.quickIcon, { backgroundColor: item.color + '20', borderColor: item.color + '40' }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <Text style={[Typography.caption, { textAlign: 'center', marginTop: 6 }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Incidents */}
        <View style={s.section}>
          <SectionHeader title="Onlangse Voorvalle" actionLabel="Sien Alles" onAction={() => router.push('/incidents')} />
          {incidents.length === 0 ? (
            <EmptyState icon="shield-outline" title="Geen voorvalle" subtitle="Jou area is veilig" />
          ) : (
            incidents.map((inc: any) => (
              <TouchableOpacity key={inc.id} onPress={() => router.push('/incidents')}>
                <PlatinumCard style={s.incidentCard}>
                  <View style={s.incidentRow}>
                    <View style={[s.incidentDot, { backgroundColor: SEVERITY_COLOR[inc.severity] || Colors.textMuted }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={Typography.bodySemi}>{inc.title}</Text>
                      <Text style={Typography.caption}>{inc.category} · {inc.address}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </View>
                </PlatinumCard>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Notices */}
        <View style={s.section}>
          <SectionHeader title="Kennisgewings" actionLabel="Sien Alles" onAction={() => router.push('/notices')} />
          {notices.length === 0 ? (
            <EmptyState icon="document-text-outline" title="Geen kennisgewings" subtitle="Geen nuwe aankondigings nie"
              actionLabel="Skep Kennisgewing" onAction={() => router.push('/notices/create')} />
          ) : (
            notices.slice(0, 3).map((n: any) => (
              <TouchableOpacity key={n.id} onPress={() => router.push(`/notices/${n.id}`)}>
                <PlatinumCard style={s.noticeCard}>
                  <Text style={Typography.bodySemi} numberOfLines={1}>{n.title}</Text>
                  <Text style={Typography.caption} numberOfLines={2}>{n.body}</Text>
                </PlatinumCard>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Events */}
        <View style={s.section}>
          <SectionHeader title="Komende Gebeure" actionLabel="Sien Alles" onAction={() => router.push('/events')} />
          {events.length === 0 ? (
            <EmptyState icon="calendar-outline" title="Geen gebeure" subtitle="Geen komende gebeure nie"
              actionLabel="Skep Geleentheid" onAction={() => router.push('/events/create')} />
          ) : (
            events.map((ev: any) => (
              <TouchableOpacity key={ev.id} onPress={() => router.push(`/events/${ev.id}`)}>
                <PlatinumCard style={s.eventCard}>
                  <View style={s.eventRow}>
                    <View style={[s.eventDate, { backgroundColor: Colors.accent + '20' }]}>
                      <Ionicons name="calendar" size={20} color={Colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={Typography.bodySemi}>{ev.title}</Text>
                      <Text style={Typography.caption}>{ev.location || 'Plek TBD'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </View>
                </PlatinumCard>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  hero: { paddingHorizontal: 16, paddingBottom: 24 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  townRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  sosBtn: { marginTop: 8 },
  sosBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full },
  sosBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statItem: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.surfaceBorder },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  section: { marginBottom: 24 },
  alertCard: { marginBottom: 8 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickItem: { width: (width - 32 - 20) / 3, alignItems: 'center' },
  quickIcon: { width: 56, height: 56, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  incidentCard: { marginBottom: 8 },
  incidentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  incidentDot: { width: 8, height: 8, borderRadius: 4 },
  noticeCard: { marginBottom: 8, gap: 4 },
  eventCard: { marginBottom: 8 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  eventDate: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
