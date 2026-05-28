import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme';
import { useAuthStore } from '../../src/store/auth';
import { posthog } from '../../src/lib/posthog';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

interface AnalyticsData {
  revenue: {
    mrr: number;
    mrrGrowth: number;
    totalSubscribers: number;
    newThisMonth: number;
    churned: number;
    churnRate: number;
  };
  community: {
    totalUsers: number;
    activeToday: number;
    avgDailyActive: number;
    verifiedUsers: number;
    pendingVerification: number;
  };
  safety: {
    totalIncidents: number;
    incidentsThisMonth: number;
    sosTriggered: number;
    sosResolved: number;
    avgResponseTime: number;
    patrolsActive: number;
  };
  lpr: {
    totalScans: number;
    flaggedPlates: number;
    watchlistSize: number;
    scansToday: number;
  };
  topAreas: { area: string; incidents: number }[];
  subscriptionBreakdown: { plan: string; count: number; revenue: number }[];
}

export default function AdminAnalyticsScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [section, setSection] = useState<'revenue' | 'community' | 'safety' | 'lpr'>('revenue');

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Analytics error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    posthog.capture('admin_analytics_viewed');
    fetchAnalytics();
  }, []);

  const onRefresh = () => { setRefreshing(true); fetchAnalytics(); };

  const StatCard = ({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color?: string }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={22} color={color ?? Colors.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Analytics Dashboard</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Section tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {([
          { key: 'revenue', label: 'Revenue', icon: 'cash' },
          { key: 'community', label: 'Community', icon: 'people' },
          { key: 'safety', label: 'Safety', icon: 'shield' },
          { key: 'lpr', label: 'LPR / Plates', icon: 'car' },
        ] as { key: typeof section; label: string; icon: string }[]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, section === tab.key && styles.activeTab]}
            onPress={() => setSection(tab.key)}
          >
            <Ionicons name={tab.icon as any} size={14} color={section === tab.key ? '#000' : Colors.muted} />
            <Text style={[styles.tabText, section === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {/* Revenue Section */}
        {section === 'revenue' && data && (
          <>
            <View style={styles.grid}>
              <StatCard icon="cash" label="MRR" value={`R${(data.revenue.mrr).toLocaleString()}`} sub={`${data.revenue.mrrGrowth > 0 ? '+' : ''}${data.revenue.mrrGrowth}% MoM`} color="#22c55e" />
              <StatCard icon="people" label="Subscribers" value={data.revenue.totalSubscribers} sub={`+${data.revenue.newThisMonth} this month`} />
              <StatCard icon="trending-down" label="Churned" value={data.revenue.churned} sub={`${data.revenue.churnRate}% rate`} color="#ef4444" />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Subscription Breakdown</Text>
              {(data.subscriptionBreakdown ?? []).map((plan, i) => (
                <View key={i} style={styles.planRow}>
                  <Text style={styles.planName}>{plan.plan}</Text>
                  <Text style={styles.planCount}>{plan.count} users</Text>
                  <Text style={styles.planRevenue}>R{plan.revenue.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Community Section */}
        {section === 'community' && data && (
          <View style={styles.grid}>
            <StatCard icon="people" label="Total Users" value={data.community.totalUsers} />
            <StatCard icon="pulse" label="Active Today" value={data.community.activeToday} />
            <StatCard icon="bar-chart" label="Avg DAU" value={data.community.avgDailyActive} />
            <StatCard icon="checkmark-circle" label="Verified" value={data.community.verifiedUsers} color="#22c55e" />
            <StatCard icon="time" label="Pending KYC" value={data.community.pendingVerification} color="#f59e0b" />
          </View>
        )}

        {/* Safety Section */}
        {section === 'safety' && data && (
          <>
            <View style={styles.grid}>
              <StatCard icon="alert-circle" label="Total Incidents" value={data.safety.totalIncidents} />
              <StatCard icon="calendar" label="This Month" value={data.safety.incidentsThisMonth} />
              <StatCard icon="radio" label="SOS Triggered" value={data.safety.sosTriggered} color="#ef4444" />
              <StatCard icon="checkmark-done" label="SOS Resolved" value={data.safety.sosResolved} color="#22c55e" />
              <StatCard icon="time" label="Avg Response" value={`${data.safety.avgResponseTime}m`} />
              <StatCard icon="walk" label="Patrols Active" value={data.safety.patrolsActive} />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Incident Areas</Text>
              {(data.topAreas ?? []).map((area, i) => (
                <View key={i} style={styles.areaRow}>
                  <Text style={styles.areaRank}>#{i + 1}</Text>
                  <Text style={styles.areaName}>{area.area}</Text>
                  <Text style={styles.areaCount}>{area.incidents} incidents</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* LPR Section */}
        {section === 'lpr' && data && (
          <View style={styles.grid}>
            <StatCard icon="scan" label="Total Scans" value={data.lpr.totalScans} />
            <StatCard icon="today" label="Scans Today" value={data.lpr.scansToday} />
            <StatCard icon="warning" label="Flagged Plates" value={data.lpr.flaggedPlates} color="#f97316" />
            <StatCard icon="eye" label="Watchlist Size" value={data.lpr.watchlistSize} color="#ef4444" />
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerText: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  tabScroll: { maxHeight: 50 },
  tabContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: Colors.card, borderRadius: 20 },
  activeTab: { backgroundColor: Colors.accent },
  tabText: { color: Colors.muted, fontSize: 12, fontWeight: '600' },
  activeTabText: { color: '#000' },
  scroll: { flex: 1, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', margin: 16, gap: 12 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.card, borderRadius: 14, padding: 16, alignItems: 'center', gap: 4 },
  statValue: { color: Colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: Colors.muted, fontSize: 12, textAlign: 'center' },
  statSub: { color: Colors.muted, fontSize: 11, textAlign: 'center' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  planRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 10, padding: 12, marginBottom: 8 },
  planName: { color: Colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  planCount: { color: Colors.muted, fontSize: 13 },
  planRevenue: { color: '#22c55e', fontSize: 14, fontWeight: '700', marginLeft: 12 },
  areaRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 10, padding: 12, marginBottom: 8, gap: 10 },
  areaRank: { color: Colors.accent, fontSize: 14, fontWeight: '800', width: 28 },
  areaName: { color: Colors.text, fontSize: 14, flex: 1 },
  areaCount: { color: Colors.muted, fontSize: 12 },
});
