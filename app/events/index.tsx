import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../src/theme';
import { PlatinumCard, ScreenHeader, EmptyState } from '../../src/components/ui';
import { eventsAPI } from '../../src/services/api';

export default function Events() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await eventsAPI.list(); setEvents(data.data || []); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={s.container}>
      <ScreenHeader title="Events" showBack right={
        <TouchableOpacity onPress={() => router.push('/events/create')}><Ionicons name="add-circle" size={28} color={Colors.primary} /></TouchableOpacity>
      } />
      <FlatList
        data={events}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? <EmptyState icon="calendar-outline" title="No events yet" actionLabel="Create Event" onAction={() => router.push('/events/create')} /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/events/${item.id}`)} style={s.item}>
            <PlatinumCard>
              <View style={s.dateBox}>
                <Text style={s.dateDay}>{new Date(item.starts_at).getDate()}</Text>
                <Text style={s.dateMonth}>{new Date(item.starts_at).toLocaleString('en-ZA', { month: 'short' }).toUpperCase()}</Text>
              </View>
              <View style={s.info}>
                <Text style={Typography.bodySemi}>{item.title}</Text>
                <Text style={Typography.caption}>{new Date(item.starts_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</Text>
                {item.location ? <Text style={[Typography.caption, { color: Colors.textMuted }]}>📍 {item.location}</Text> : null}
                {item.rsvp_count != null ? <Text style={[Typography.caption, { color: Colors.accent }]}>👥 {item.rsvp_count} attending</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </PlatinumCard>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  item: { marginBottom: 8 },
  dateBox: { width: 48, alignItems: 'center', marginRight: 12, backgroundColor: Colors.primary + '30', borderRadius: 10, padding: 6 },
  dateDay: { fontSize: 22, fontWeight: '800', color: Colors.textHeading },
  dateMonth: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  info: { flex: 1 },
});
