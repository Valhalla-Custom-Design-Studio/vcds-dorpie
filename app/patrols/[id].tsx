import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/theme';
import { PlatinumCard, PlatinumButton, ScreenHeader, Badge } from '@/components/ui';
import { patrols } from '@/services/api';

export default function PatrolDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [patrol, setPatrol] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    patrols.get(id!).then(r => setPatrol(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const join = async () => {
    setJoining(true);
    try { await patrols.join(id!); Alert.alert('✅ Joined patrol!'); }
    catch { Alert.alert('Failed to join patrol'); }
    finally { setJoining(false); }
  };

  const checkin = async () => {
    setChecking(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Location permission required'); return; }
      const loc = await Location.getCurrentPositionAsync({});
      await patrols.checkin(id!, loc.coords.latitude, loc.coords.longitude);
      Alert.alert('✅ Check-in recorded!');
    } catch { Alert.alert('Check-in failed'); }
    finally { setChecking(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (!patrol) return <View style={s.center}><Text style={Typography.body}>Patrol not found</Text></View>;

  return (
    <View style={s.container}>
      <ScreenHeader title="Patrol Details" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <PlatinumCard>
          <View style={s.titleRow}>
            <Text style={Typography.h2}>{patrol.name}</Text>
            <Badge label={patrol.status === 'active' ? 'LIVE' : patrol.status?.toUpperCase()} variant={patrol.status === 'active' ? 'success' : 'muted'} />
          </View>
          <View style={s.metaGrid}>
            {[
              { icon: 'location', val: patrol.area },
              { icon: 'people', val: `${patrol.member_count || 0} members` },
              { icon: 'time', val: patrol.start_time ? new Date(patrol.start_time).toLocaleString('en-ZA') : 'Ongoing' },
            ].filter(m => m.val).map(m => (
              <View key={m.icon} style={s.metaItem}>
                <Ionicons name={m.icon as any} size={15} color={Colors.accent} />
                <Text style={[Typography.caption, { marginLeft: 6 }]}>{m.val}</Text>
              </View>
            ))}
          </View>
          {patrol.description ? <Text style={[Typography.body, { lineHeight: 22, marginTop: 10 }]}>{patrol.description}</Text> : null}
        </PlatinumCard>
        <View style={s.btnRow}>
          <PlatinumButton label="Join Patrol" onPress={join} loading={joining} style={{ flex: 1 }} />
          <PlatinumButton label="GPS Check-In" onPress={checkin} loading={checking} variant="secondary" style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  metaGrid: { gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  btnRow: { flexDirection: 'row', gap: 12 },
});
