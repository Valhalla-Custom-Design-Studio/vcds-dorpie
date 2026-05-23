import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/theme';
import { PlatinumCard, Badge } from '../../src/components/ui';
import { noticesAPI, emergencyAlertsAPI, eventsAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth';

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const [notices, setNotices] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [n, a, e] = await Promise.allSettled([
        noticesAPI.list({ page: 1 }),
        emergencyAlertsAPI.list(),
        eventsAPI.list({ page: 1 }),
      ]);
      if (n.status === 'fulfilled') setNotices(n.value.data.data?.slice(0, 5) || []);
      if (a.status === 'fulfilled') setAlerts(a.value.data.data?.slice(0, 3) || []);
      if (e.status === 'fulfilled') setEvents(e.value.data.data?.slice(0, 3) || []);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={[Typography.caption, { color: Colors.textMuted }]}>{greeting()},</Text>
          <Text style={Typography.h1}>{user?.name?.split(' ')[0]} 👋</Text>
          {user?.town_name ? <Text style={[Typography.caption, { color: Colors.accent }]}>📍 {user.town_name}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => router.push('/sos-active')} style={s.sosBtn}>
          <Ionicons name="warning" size={20} color="#fff" />
          <Text style={s.sosBtnText}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <View style={s.section}>
          <Text style={[Typography.h3, s.sectionTitle]}>🚨 Active Alerts</Text>
          {alerts.map((a: any) => (
            <TouchableOpacity key={a.id} onPress={() => router.push(`/emergency-alert/${a.id}`)}>
              <PlatinumCard style={[s.alertCard, { borderColor: Colors.red }]}>
                <View style={s.alertRow}>
                  <Ionicons name="alert-circle" size={20} color={Colors.red} />
                  <View style={s.alertText}>
                    <Text style={[Typography.bodySemi, { color: Colors.red }]}>{a.title}</Text>
                    <Text style={Typography.caption} numberOfLines={1}>{a.description}</Text>
                  </View>
                  <Badge label={a.severity || 'HIGH'} variant="error" />
                </View>
              </PlatinumCard>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={s.section}>
        <Text style={[Typography.h3, s.sectionTitle]}>Quick Actions</Text>
        <View style={s.quickGrid}>
          {[
            { icon: 'document-text', label: 'Notices', route: '/notices' },
            { icon: 'calendar', label: 'Events', route: '/events' },
            { icon: 'map', label: 'Heatmap', route: '/heatmap' },
            { icon: 'shield-checkmark', label: 'Patrols', route: '/patrols' },
            { icon: 'location', label: 'Check-In', route: '/movement-checkin' },
            { icon: 'people', label: 'Guardian', route: '/guardian' },
            { icon: 'chatbubbles', label: 'Messages', route: '/messages' },
            { icon: 'bag', label: 'Market', route: '/listings' },
          ].map(item => (
            <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)} style={s.quickItem}>
              <View style={s.quickIcon}>
                <Ionicons name={item.icon as any} size={24} color={Colors.primary} />
              </View>
              <Text style={[Typography.caption, { marginTop: 4 }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Notices */}
      {notices.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={Typography.h3}>📋 Recent Notices</Text>
            <TouchableOpacity onPress={() => router.push('/notices')}><Text style={{ color: Colors.accent, fontSize: 14 }}>See all</Text></TouchableOpacity>
          </View>
          {notices.map((n: any) => (
            <TouchableOpacity key={n.id} onPress={() => router.push(`/notices/${n.id}`)}>
              <PlatinumCard style={s.noticeCard}>
                <View style={s.noticeRow}>
                  <View style={s.noticeContent}>
                    <Text style={Typography.bodySemi} numberOfLines={1}>{n.title}</Text>
                    <Text style={Typography.caption} numberOfLines={2}>{n.body}</Text>
                    <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 4 }]}>
                      {new Date(n.created_at).toLocaleDateString('en-ZA')} · {n.category}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </View>
              </PlatinumCard>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Upcoming Events */}
      {events.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Text style={Typography.h3}>📅 Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push('/events')}><Text style={{ color: Colors.accent, fontSize: 14 }}>See all</Text></TouchableOpacity>
          </View>
          {events.map((e: any) => (
            <TouchableOpacity key={e.id} onPress={() => router.push(`/events/${e.id}`)}>
              <PlatinumCard style={s.noticeCard}>
                <Text style={Typography.bodySemi} numberOfLines={1}>{e.title}</Text>
                <Text style={Typography.caption}>{new Date(e.starts_at).toLocaleString('en-ZA')}</Text>
                {e.location ? <Text style={[Typography.caption, { color: Colors.textMuted }]}>📍 {e.location}</Text> : null}
              </PlatinumCard>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  sosBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.red, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 24,
  },
  sosBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  alertCard: { marginBottom: 8 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertText: { flex: 1 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickItem: { width: '21%', alignItems: 'center' },
  quickIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  noticeCard: { marginBottom: 8 },
  noticeRow: { flexDirection: 'row', alignItems: 'center' },
  noticeContent: { flex: 1 },
});
