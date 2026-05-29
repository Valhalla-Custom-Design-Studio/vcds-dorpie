import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/theme';
import { PlatinumCard, Badge, ScreenHeader, EmptyState, FilterPill } from '@/components/ui';
import { reportsAPI } from '@/services/api';

const CATS = ['All', 'Theft', 'Break-in', 'Vandalism', 'Suspicious', 'Assault', 'Other'];

export default function Incidents() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [cat, setCat] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await reportsAPI.list({ category: cat !== 'All' ? cat : undefined });
      setReports(data.data || []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [cat]);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Voorvalle"
        showBack
        right={<TouchableOpacity onPress={() => router.push('/incidents/create')}><Ionicons name="add-circle" size={28} color={Colors.primary} /></TouchableOpacity>}
      />
      <FlatList
        data={reports}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <FlatList
            horizontal data={CATS} keyExtractor={i => i}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.pillBar}
            renderItem={({ item }) => <FilterPill label={item} active={cat === item} onPress={() => setCat(item)} />}
          />
        }
        ListEmptyComponent={!loading ? (
          <EmptyState
            icon="shield-outline"
            title="Geen voorvalle gerapporteer nie"
            subtitle="Hou jou gemeenskap veilig deur verdagte aktiwiteit te rapporteer"
            actionLabel="Rapporteer Voorval"
            onAction={() => router.push('/incidents/create')}
          />
        ) : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/incidents/${item.id}` as any)} style={s.item}>
            <PlatinumCard accentColor={item.severity === 'high' ? Colors.accentRed : item.severity === 'medium' ? Colors.accentYellow : undefined}>
              <View style={s.row}>
                <View style={s.content}>
                  <View style={s.metaRow}>
                    <Badge label={item.category || 'Incident'} variant={item.severity === 'high' ? 'error' : item.severity === 'medium' ? 'warning' : 'muted'} />
                    <Text style={[Typography.caption, { color: Colors.textMuted, marginLeft: 8 }]}>
                      {new Date(item.created_at).toLocaleDateString('af-ZA')}
                    </Text>
                  </View>
                  <Text style={[Typography.bodySemi, { marginTop: 6 }]} numberOfLines={2}>{item.description}</Text>
                  {item.location ? <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 4 }]}>📍 {item.location}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            </PlatinumCard>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  pillBar: { paddingHorizontal: 16, paddingVertical: 12 },
  item: { marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  content: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
});
