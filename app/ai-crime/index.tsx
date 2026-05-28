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
import { aiCrimeAPI } from '../../src/services/api';
import { posthog } from '../../src/lib/posthog';

interface CrimePrediction {
  area: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  topFactors: string[];
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  predictedIncidents: number;
  lastUpdated: string;
}

interface CrimeStats {
  totalIncidents: number;
  hotspots: number;
  resolvedRate: number;
  avgResponseTime: number;
  predictions: CrimePrediction[];
  weeklyTrend: { day: string; count: number }[];
}

const RISK_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const TREND_ICONS: Record<string, string> = {
  INCREASING: 'trending-up',
  STABLE: 'remove',
  DECREASING: 'trending-down',
};

export default function AICrimeScreen() {
  const router = useRouter();
  
  const [stats, setStats] = useState<CrimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'predictions' | 'stats'>('predictions');

  const fetchData = async () => {
    try {
      const { data } = await aiCrimeAPI.predictions();
      setStats(data);
    } catch (e) {
      console.error('AI crime fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    posthog.capture('ai_crime_screen_viewed');
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getRiskBadge = (level: string) => (
    <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[level] + '22', borderColor: RISK_COLORS[level] }]}>
      <Text style={[styles.riskText, { color: RISK_COLORS[level] }]}>{level}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.loadingText}>Analysing crime patterns...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.accent} />
          <Text style={styles.headerText}>AI Crime Intelligence</Text>
        </View>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['predictions', 'stats'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'predictions' ? 'Predictions' : 'Statistics'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {activeTab === 'predictions' ? (
          <>
            {/* AI Disclaimer */}
            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.accent} />
              <Text style={styles.disclaimerText}>
                AI-powered intelligence based on historical patterns and community data. Not a guarantee of future incidents.
              </Text>
            </View>

            {/* Predictions */}
            {(stats?.predictions ?? []).map((pred, i) => (
              <View key={i} style={styles.predCard}>
                <View style={styles.predHeader}>
                  <Text style={styles.areaName}>{pred.area}</Text>
                  {getRiskBadge(pred.riskLevel)}
                </View>
                <View style={styles.predMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="bar-chart-outline" size={14} color={Colors.muted} />
                    <Text style={styles.metaText}>Risk score: {pred.score}%</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name={(TREND_ICONS[pred.trend] as any)} size={14} color={Colors.muted} />
                    <Text style={styles.metaText}>{pred.trend.toLowerCase()}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="alert-circle-outline" size={14} color={Colors.muted} />
                    <Text style={styles.metaText}>~{pred.predictedIncidents} incidents/week</Text>
                  </View>
                </View>
                {pred.topFactors.length > 0 && (
                  <View style={styles.factors}>
                    <Text style={styles.factorsLabel}>Key factors:</Text>
                    {pred.topFactors.slice(0, 3).map((f, j) => (
                      <View key={j} style={styles.factorChip}>
                        <Text style={styles.factorText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={styles.updated}>Updated {new Date(pred.lastUpdated).toLocaleDateString()}</Text>
              </View>
            ))}

            {(stats?.predictions ?? []).length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="analytics-outline" size={48} color={Colors.muted} />
                <Text style={styles.emptyText}>No predictions available yet</Text>
                <Text style={styles.emptySubText}>More community data needed to generate predictions</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Summary stats */}
            <View style={styles.statsGrid}>
              {[
                { label: 'Total Incidents', value: stats?.totalIncidents ?? 0, icon: 'alert-circle' },
                { label: 'Active Hotspots', value: stats?.hotspots ?? 0, icon: 'flame' },
                { label: 'Resolved Rate', value: `${stats?.resolvedRate ?? 0}%`, icon: 'checkmark-circle' },
                { label: 'Avg Response', value: `${stats?.avgResponseTime ?? 0}m`, icon: 'time' },
              ].map((item, i) => (
                <View key={i} style={styles.statCard}>
                  <Ionicons name={item.icon as any} size={24} color={Colors.accent} />
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Weekly trend */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly Incident Trend</Text>
              <View style={styles.trendChart}>
                {(stats?.weeklyTrend ?? []).map((day, i) => {
                  const max = Math.max(...(stats?.weeklyTrend ?? [{ count: 1 }]).map((d) => d.count), 1);
                  const height = Math.max((day.count / max) * 80, 4);
                  return (
                    <View key={i} style={styles.barWrapper}>
                      <Text style={styles.barValue}>{day.count}</Text>
                      <View style={[styles.bar, { height }]} />
                      <Text style={styles.barLabel}>{day.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: Colors.muted, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.card, borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: Colors.accent },
  tabText: { color: Colors.muted, fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#000' },
  scroll: { flex: 1 },
  disclaimer: { flexDirection: 'row', gap: 8, margin: 16, padding: 12, backgroundColor: Colors.accent + '15', borderRadius: 10, alignItems: 'flex-start' },
  disclaimerText: { flex: 1, color: Colors.muted, fontSize: 12, lineHeight: 18 },
  predCard: { marginHorizontal: 16, marginBottom: 12, padding: 16, backgroundColor: Colors.card, borderRadius: 14 },
  predHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  areaName: { color: Colors.text, fontSize: 16, fontWeight: '700', flex: 1 },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  riskText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  predMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: Colors.muted, fontSize: 12 },
  factors: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 8 },
  factorsLabel: { color: Colors.muted, fontSize: 12 },
  factorChip: { backgroundColor: Colors.accent + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  factorText: { color: Colors.accent, fontSize: 11 },
  updated: { color: Colors.muted, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  emptySubText: { color: Colors.muted, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', margin: 16, gap: 12 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.card, borderRadius: 14, padding: 16, alignItems: 'center', gap: 6 },
  statValue: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: Colors.muted, fontSize: 12, textAlign: 'center' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  trendChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: 14, padding: 16, height: 140 },
  barWrapper: { alignItems: 'center', gap: 4 },
  barValue: { color: Colors.muted, fontSize: 10 },
  bar: { width: 28, backgroundColor: Colors.accent, borderRadius: 6 },
  barLabel: { color: Colors.muted, fontSize: 11 },
});
