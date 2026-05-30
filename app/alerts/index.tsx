import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '@/theme';
import { PlatinumCard, Badge, ScreenHeader, EmptyState, FilterPill } from '@/components/ui';
import { emergencyAlertsAPI } from '@/services/api';

const FILTERS = ['Alles', 'Kritiek', 'Hoog', 'Medium', 'Laag'];
const SEVERITY_COLOR: Record<string, string> = {
  critical: Colors.accentRed, high: Colors.accentOrange,
  medium: Colors.accentYellow, low: Colors.accentGreen,
};
const SEVERITY_LABEL: Record<string, string> = {
  critical: 'KRITIEK', high: 'HOOG', medium: 'MEDIUM', low: 'LAAG',
};

export default function Alerts() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filter, setFilter] = useState('Alles');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await emergencyAlertsAPI.list();
      setAlerts(data.data || []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'Alles' ? alerts : alerts.filter(a => {
    const map: Record<string, string> = { Kritiek: 'critical', Hoog: 'high', Medium: 'medium', Laag: 'low' };
    return a.severity === map[filter];
  });

  return (
    <View style={s.container}>
      <ScreenHeader title="Waarskuwings" showBack />
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <FlatList
            horizontal data={FILTERS} keyExtractor={i => i}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.pillBar}
            renderItem={({ item }) => <FilterPill label={item} active={filter === item} onPress={() => setFilter(item)} />}
          />
        }
        ListEmptyComponent={!loading ? (
          <EmptyState icon="notifications-outline" title="Geen waarskuwings" subtitle="Geen aktiewe waarskuwings in jou area nie" />
        ) : null}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <PlatinumCard accentColor={SEVERITY_COLOR[item.severity]} style={s.card}>
            <View style={s.row}>
              <View style={[s.dot, { backgroundColor: SEVERITY_COLOR[item.severity] || Colors.textMuted }]} />
              <View style={{ flex: 1 }}>
                <Text style={Typography.bodySemi}>{item.title}</Text>
                <Text style={Typography.caption}>{item.area || item.address}</Text>
                <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 2 }]}>{item.created_at ? new Date(item.created_at).toLocaleString('af-ZA') : ''}</Text>
              </View>
              <Badge label={SEVERITY_LABEL[item.severity] || 'ALERT'} color={SEVERITY_COLOR[item.severity] || Colors.textMuted} />
            </View>
          </PlatinumCard>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  pillBar: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
