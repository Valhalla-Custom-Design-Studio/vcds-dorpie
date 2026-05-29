import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '@/theme';
import { PlatinumCard, ScreenHeader, EmptyState, FilterPill } from '@/components/ui';
import { eventsAPI } from '@/services/api';

const CATS = ['All', 'Markte', 'Skool', 'Kerk', 'Sport', 'Gemeenskap'];

export default function Events() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [cat, setCat] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await eventsAPI.list({ category: cat !== 'All' ? cat : undefined });
      setEvents(data.data || []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [cat]);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Gebeure"
        right={<TouchableOpacity onPress={() => router.push('/events/create')}><Ionicons name="add-circle" size={28} color={Colors.primary} /></TouchableOpacity>}
        showBack
      />
      <FlatList
        data={events}
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
            icon="calendar-outline"
            title="Nog geen gebeure nie"
            subtitle="Kyk later vir komende gemeenskapsgebeure"
            actionLabel="Voeg Gebeurtenis By"
            onAction={() => router.push('/events/create')}
          />
        ) : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/events/${item.id}` as any)} style={s.item}>
            <PlatinumCard>
              <View style={s.row}>
                <View style={s.dateBox}>
                  <Text style={s.dateDay}>{new Date(item.starts_at).getDate()}</Text>
                  <Text style={s.dateMonth}>{new Date(item.starts_at).toLocaleString('af-ZA', { month: 'short' }).toUpperCase()}</Text>
                </View>
                <View style={s.info}>
                  <Text style={Typography.bodySemi}>{item.title}</Text>
                  <Text style={Typography.caption}>{new Date(item.starts_at).toLocaleTimeString('af-ZA', { hour: '2-digit', minute: '2-digit' })}</Text>
                  {item.location ? <Text style={[Typography.caption, { color: Colors.textMuted }]}>📍 {item.location}</Text> : null}
                  {item.rsvp_count != null ? <Text style={[Typography.caption, { color: Colors.accent }]}>👥 {item.rsvp_count} bywoning</Text> : null}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBox: {
    width: 48, height: 52, borderRadius: 10,
    backgroundColor: Colors.primary + '22',
    borderWidth: 1, borderColor: Colors.primary + '44',
    alignItems: 'center', justifyContent: 'center',
  },
  dateDay: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  dateMonth: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  info: { flex: 1 },
});
