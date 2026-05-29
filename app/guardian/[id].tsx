import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/theme';
import { PlatinumCard, ScreenHeader } from '@/components/ui';
import { guardianAPI } from '@/services/api';

export default function GuardianTrack() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [location, setLocation] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [loc, hist] = await Promise.allSettled([guardianAPI.locate(id!), guardianAPI.history(id!)]);
      if (loc.status === 'fulfilled') setLocation(loc.value.data.data);
      if (hist.status === 'fulfilled') setHistory(hist.value.data.data || []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  return (
    <View style={s.container}>
      <ScreenHeader title="Track Location" showBack right={
        <TouchableOpacity onPress={() => { setLoading(true); load(); }}>
          <Ionicons name="refresh" size={22} color={Colors.primary} />
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={s.scroll}>
        <PlatinumCard>
          <Text style={[Typography.h3, { marginBottom: 12 }]}>📍 Current Location</Text>
          {location ? (
            <>
              <Text style={Typography.body}>{location.address || `${location.latitude?.toFixed(5)}, ${location.longitude?.toFixed(5)}`}</Text>
              <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 4 }]}>Updated: {new Date(location.updated_at || location.created_at).toLocaleString('en-ZA')}</Text>
            </>
          ) : (
            <Text style={[Typography.body, { color: Colors.textMuted }]}>No location data available yet</Text>
          )}
        </PlatinumCard>
        <Text style={[Typography.h3, { marginBottom: 12 }]}>Location History</Text>
        {history.length === 0 ? (
          <PlatinumCard><Text style={[Typography.body, { color: Colors.textMuted, textAlign: 'center' }]}>No history available</Text></PlatinumCard>
        ) : history.slice(0, 10).map((h: any) => (
          <PlatinumCard key={h.id} style={s.histItem}>
            <View style={s.histRow}>
              <Ionicons name="location" size={14} color={Colors.accent} />
              <Text style={[Typography.caption, { flex: 1, marginLeft: 6 }]}>{h.address || `${h.latitude?.toFixed(4)}, ${h.longitude?.toFixed(4)}`}</Text>
              <Text style={[Typography.caption, { color: Colors.textMuted }]}>{new Date(h.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </PlatinumCard>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  scroll: { padding: 16, paddingBottom: 32, gap: 8 },
  histItem: { padding: 10 },
  histRow: { flexDirection: 'row', alignItems: 'center' },
});
