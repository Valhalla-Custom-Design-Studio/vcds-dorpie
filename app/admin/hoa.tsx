/**
 * Dorpwag™ HOA Admin Panel
 * Platinum-only — HOA administrators only
 * Features: LPR management, resident management, incident reports, analytics
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Radius, Shadow } from '@/theme';
import { PlatinumCard, ScreenHeader, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/auth';

interface HOAStats {
  totalResidents: number;
  activeAlerts: number;
  lprScansToday: number;
  watchlistHits: number;
  patrolsActive: number;
}

interface RecentAlert {
  id: string;
  type: 'lpr_hit' | 'sos' | 'geofence' | 'facial';
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function HOAAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState<HOAStats | null>(null);
  const [alerts, setAlerts] = useState<RecentAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'residents' | 'lpr' | 'reports'>('dashboard');

  const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://vcds-dorpie.onrender.com';

  const fetchData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/hoa/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/admin/hoa/alerts?limit=20`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (alertsRes.ok) setAlerts((await alertsRes.json()).alerts || []);
    } catch (e) {
      // Use mock data for demo
      setStats({ totalResidents: 247, activeAlerts: 3, lprScansToday: 1842, watchlistHits: 2, patrolsActive: 4 });
      setAlerts([
        { id: '1', type: 'lpr_hit', message: 'Watchlist voertuig: CA 123-456 — Hoofpoort', timestamp: '14:32', severity: 'high' },
        { id: '2', type: 'sos', message: 'SOS: Eenheid 42 — Mnr. Botha', timestamp: '13:15', severity: 'critical' },
        { id: '3', type: 'geofence', message: 'GeoFence oorskryding: Suid-grens', timestamp: '11:48', severity: 'medium' },
      ]);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const severityColor = (s: string) => ({
    low: '#6B7280', medium: '#F59E0B', high: '#EF4444', critical: '#DC2626',
  }[s] || '#6B7280');

  const alertIcon = (type: string) => ({
    lpr_hit: 'car', sos: 'alert-circle', geofence: 'location', facial: 'person',
  }[type] as any || 'warning');

  const TABS = [
    { id: 'dashboard', label: 'Paneelbord', icon: 'grid' },
    { id: 'residents', label: 'Inwoners', icon: 'people' },
    { id: 'lpr', label: 'LPR Bestuur', icon: 'car' },
    { id: 'reports', label: 'Verslae', icon: 'bar-chart' },
  ] as const;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0A0A0F', '#111827']} style={StyleSheet.absoluteFill} />

      <ScreenHeader
        title="HOA Admin Paneel"
        subtitle="Platinum Bestuurder"
        rightAction={{ icon: 'settings-outline', onPress: () => router.push('/admin/settings' as any) }}
      />

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.id ? '#C9A84C' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />}
      >
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {stats && [
                { label: 'Inwoners', value: stats.totalResidents, icon: 'people', color: '#3B82F6' },
                { label: 'Aktiewe Waarskuwings', value: stats.activeAlerts, icon: 'alert-circle', color: '#EF4444' },
                { label: 'LPR Skanderings Vandag', value: stats.lprScansToday.toLocaleString(), icon: 'car', color: '#C9A84C' },
                { label: 'Waglys Treffers', value: stats.watchlistHits, icon: 'eye', color: '#F59E0B' },
                { label: 'Aktiewe Patrollies', value: stats.patrolsActive, icon: 'shield', color: '#10B981' },
              ].map((s, i) => (
                <PlatinumCard key={i} style={styles.statCard}>
                  <Ionicons name={s.icon as any} size={20} color={s.color} />
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </PlatinumCard>
              ))}
            </View>

            {/* Recent Alerts */}
            <Text style={styles.sectionTitle}>Onlangse Waarskuwings</Text>
            {alerts.map(alert => (
              <PlatinumCard key={alert.id} style={styles.alertCard}>
                <View style={[styles.alertDot, { backgroundColor: severityColor(alert.severity) }]} />
                <Ionicons name={alertIcon(alert.type)} size={20} color={severityColor(alert.severity)} />
                <View style={styles.alertContent}>
                  <Text style={styles.alertMsg}>{alert.message}</Text>
                  <Text style={styles.alertTime}>{alert.timestamp}</Text>
                </View>
                <Badge label={alert.severity.toUpperCase()} color={severityColor(alert.severity)} />
              </PlatinumCard>
            ))}
          </>
        )}

        {activeTab === 'lpr' && (
          <>
            <Text style={styles.sectionTitle}>LPR Kamera Bestuur</Text>
            <PlatinumCard style={styles.lprCard}>
              <View style={styles.lprHeader}>
                <Ionicons name="camera" size={24} color="#C9A84C" />
                <Text style={styles.lprTitle}>Hikvision Kameras</Text>
                <Badge label="AANLYN" color="#10B981" />
              </View>
              <Text style={styles.lprSub}>Koppel en bestuur Hikvision LPR-kameras via ISAPI</Text>
              <TouchableOpacity style={styles.lprBtn} onPress={() => router.push('/admin/lpr/hikvision' as any)}>
                <Text style={styles.lprBtnText}>Bestuur Kameras →</Text>
              </TouchableOpacity>
            </PlatinumCard>

            <PlatinumCard style={styles.lprCard}>
              <View style={styles.lprHeader}>
                <Ionicons name="scan" size={24} color="#3B82F6" />
                <Text style={styles.lprTitle}>Snipr™ Mobiele LPR</Text>
                <Badge label="AKTIEF" color="#3B82F6" />
              </View>
              <Text style={styles.lprSub}>Mobiele nommerbord-skandering vir wagposte en patrollies</Text>
              <TouchableOpacity style={[styles.lprBtn, { backgroundColor: '#3B82F6' }]} onPress={() => router.push('/lpr/scan' as any)}>
                <Text style={styles.lprBtnText}>Begin Skandering →</Text>
              </TouchableOpacity>
            </PlatinumCard>

            <PlatinumCard style={styles.lprCard}>
              <View style={styles.lprHeader}>
                <Ionicons name="list" size={24} color="#EF4444" />
                <Text style={styles.lprTitle}>Waglys Bestuur</Text>
              </View>
              <Text style={styles.lprSub}>Voeg voertuie by die gemeenskap-waglys</Text>
              <TouchableOpacity style={[styles.lprBtn, { backgroundColor: '#EF4444' }]} onPress={() => router.push('/admin/lpr/watchlist' as any)}>
                <Text style={styles.lprBtnText}>Bestuur Waglys →</Text>
              </TouchableOpacity>
            </PlatinumCard>
          </>
        )}

        {activeTab === 'residents' && (
          <>
            <Text style={styles.sectionTitle}>Inwoner Bestuur</Text>
            <PlatinumCard style={styles.actionCard}>
              <Ionicons name="person-add" size={24} color="#C9A84C" />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Voeg Inwoner By</Text>
                <Text style={styles.actionSub}>Registreer nuwe inwoner en voertuig</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </PlatinumCard>
            <PlatinumCard style={styles.actionCard}>
              <Ionicons name="car" size={24} color="#3B82F6" />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Voertuig Registrasie</Text>
                <Text style={styles.actionSub}>Goedgekeurde voertuie vir LPR</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </PlatinumCard>
            <PlatinumCard style={styles.actionCard}>
              <Ionicons name="key" size={24} color="#10B981" />
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Toegangsbeheer</Text>
                <Text style={styles.actionSub}>Bestuur inwoner-toegangsregte</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </PlatinumCard>
          </>
        )}

        {activeTab === 'reports' && (
          <>
            <Text style={styles.sectionTitle}>Verslae & Analise</Text>
            {[
              { title: 'Maandelikse Veiligheidsverslag', icon: 'document-text', color: '#C9A84C' },
              { title: 'LPR Skandering Geskiedenis', icon: 'car', color: '#3B82F6' },
              { title: 'Voorval Verslae', icon: 'alert-circle', color: '#EF4444' },
              { title: 'Patrollie Logboek', icon: 'shield', color: '#10B981' },
            ].map((r, i) => (
              <PlatinumCard key={i} style={styles.actionCard}>
                <Ionicons name={r.icon as any} size={24} color={r.color} />
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{r.title}</Text>
                </View>
                <Ionicons name="download-outline" size={20} color="#6B7280" />
              </PlatinumCard>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  tabBar: { maxHeight: 52 },
  tabBarContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1F2937' },
  tabActive: { backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)' },
  tabText: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#C9A84C' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  statCard: { width: '47%', alignItems: 'center', padding: 16, gap: 6 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#9CA3AF', fontSize: 11, textAlign: 'center' },
  sectionTitle: { color: '#F9FAFB', fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, padding: 14 },
  alertDot: { width: 8, height: 8, borderRadius: 4 },
  alertContent: { flex: 1 },
  alertMsg: { color: '#F9FAFB', fontSize: 13, fontWeight: '500' },
  alertTime: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  lprCard: { marginBottom: 12, padding: 16 },
  lprHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  lprTitle: { color: '#F9FAFB', fontSize: 15, fontWeight: '700', flex: 1 },
  lprSub: { color: '#9CA3AF', fontSize: 13, marginBottom: 12 },
  lprBtn: { backgroundColor: '#C9A84C', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, alignSelf: 'flex-start' },
  lprBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8, padding: 16 },
  actionContent: { flex: 1 },
  actionTitle: { color: '#F9FAFB', fontSize: 14, fontWeight: '600' },
  actionSub: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
});
