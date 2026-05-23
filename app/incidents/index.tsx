import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../src/theme';
import { PlatinumCard, Badge, ScreenHeader, EmptyState } from '../../src/components/ui';
import { reportsAPI } from '../../src/services/api';

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

  const severityColor = (s: string) => s === 'high' ? Colors.red : s === 'medium' ? Colors.warning : Colors.success;

  return (
    <View style={s.container}>
      <ScreenHeader title="Incident Reports" showBack right={
        <TouchableOpacity onPress={() => router.push('/incidents/create')}><Ionicons name="add-circle" size={28} color={Colors.primary} /></TouchableOpacity>
      } />
      <FlatList
        data={reports}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <FlatList horizontal data={CATS} keyExtractor={i => i} showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catBar}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setCat(item)} style={[s.catPill, cat === item && s.catActive]}>
                <Text style={[s.catText, cat === item && { color: '#fff' }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        }
        ListEmptyComponent={!loading ? <EmptyState icon="shield-outline" title="No incidents reported" subtitle="Keep your community safe by reporting suspicious activity" actionLabel="Report Incident" onAction={() => router.push('/incidents/create')} /> : null}
        renderItem={({ item }) => (
          <PlatinumCard style={s.card}>
            <View style={s.row}>
              <View style={[s.dot, { backgroundColor: severityColor(item.severity || 'low') }]} />
              <View style={s.content}>
                <Text style={Typography.bodySemi}>{item.title}</Text>
                <Text style={[Typography.caption, { marginTop: 2 }]} numberOfLines={2}>{item.description}</Text>
                <View style={s.meta}>
                  <Badge label={item.category || 'Other'} variant="muted" />
                  <Text style={[Typography.caption, { color: Colors.textMuted }]}>{new Date(item.created_at).toLocaleDateString('en-ZA')}</Text>
                  {item.address && <Text style={[Typography.caption, { color: Colors.textMuted }]}>📍 {item.address}</Text>}
                </View>
              </View>
            </View>
          </PlatinumCard>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 8, flexGrow: 1 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  catBar: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  catActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { color: Colors.textBody, fontSize: 13, fontWeight: '600' },
  card: {},
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, marginRight: 10 },
  content: { flex: 1 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
});
