import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/theme';
import { PlatinumCard, PlatinumButton, ScreenHeader } from '@/components/ui';
import { eventsAPI } from '@/services/api';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState(false);

  useEffect(() => {
    eventsAPI.get(id!).then(r => setEvent(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const rsvp = async () => {
    setRsvping(true);
    try { await eventsAPI.rsvp(id!); Alert.alert('✅ RSVP confirmed!'); }
    catch { Alert.alert('Failed to RSVP'); }
    finally { setRsvping(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (!event) return <View style={s.center}><Text style={Typography.body}>Event not found</Text></View>;

  return (
    <View style={s.container}>
      <ScreenHeader title="Event Details" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <PlatinumCard>
          <Text style={Typography.h1}>{event.title}</Text>
          <View style={s.metaGrid}>
            <View style={s.metaItem}><Ionicons name="calendar" size={16} color={Colors.accent} /><Text style={s.metaText}>{new Date(event.starts_at).toLocaleDateString('en-ZA')}</Text></View>
            <View style={s.metaItem}><Ionicons name="time" size={16} color={Colors.accent} /><Text style={s.metaText}>{new Date(event.starts_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</Text></View>
            {event.location && <View style={s.metaItem}><Ionicons name="location" size={16} color={Colors.accent} /><Text style={s.metaText}>{event.location}</Text></View>}
            {event.rsvp_count != null && <View style={s.metaItem}><Ionicons name="people" size={16} color={Colors.accent} /><Text style={s.metaText}>{event.rsvp_count} attending</Text></View>}
          </View>
          {event.description ? <Text style={[Typography.body, { lineHeight: 24, marginTop: 12 }]}>{event.description}</Text> : null}
          <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 12 }]}>Organised by {event.organiser_name || 'Community'}</Text>
        </PlatinumCard>
        <PlatinumButton label="RSVP — I'm Attending" onPress={rsvp} loading={rsvping} style={{ marginTop: 16 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  scroll: { padding: 16, paddingBottom: 32 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 14, color: Colors.textBody },
});
