import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/theme';
import { PlatinumCard, Badge, ScreenHeader, EmptyState } from '@/components/ui';
import { patrols } from '@/services/api';

export default function Patrols() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await patrols.list(); setList(data.data || []); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={s.container}>
      <ScreenHeader title="Neighbourhood Patrols" showBack />
      <FlatList
        data={list}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? <EmptyState icon="shield-checkmark-outline" title="No active patrols" subtitle="Patrols keep your community safe" /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/patrols/${item.id}`)} style={s.item}>
            <PlatinumCard>
              <View style={s.row}>
                <View style={[s.icon, { backgroundColor: item.status === 'active' ? Colors.success + '20' : Colors.surface }]}>
                  <Ionicons name="shield-checkmark" size={24} color={item.status === 'active' ? Colors.success : Colors.textMuted} />
                </View>
                <View style={s.content}>
                  <Text style={Typography.bodySemi}>{item.name}</Text>
                  <Text style={Typography.caption}>{item.area} · {item.member_count || 0} members</Text>
                  <Text style={[Typography.caption, { color: Colors.textMuted }]}>
                    {item.start_time ? `Starts: ${new Date(item.start_time).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}` : 'Ongoing'}
                  </Text>
                </View>
                <Badge label={item.status === 'active' ? 'LIVE' : item.status?.toUpperCase() || 'SCHEDULED'} variant={item.status === 'active' ? 'success' : 'muted'} />
              </View>
            </PlatinumCard>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 8, flexGrow: 1 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  item: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
});
