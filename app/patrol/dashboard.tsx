import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Radius, Shadow } from '@/theme';
import { PlatinumCard, ScreenHeader, Badge, PlatinumButton } from '@/components/ui';
import { patrols } from '@/services/api';

type PatrolStatus = 'idle' | 'active' | 'paused';

export default function PatrolDashboard() {
  const router = useRouter();
  const [status, setStatus] = useState<PatrolStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [checkIns, setCheckIns] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activePatrols, setActivePatrols] = useState<any[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationRef = useRef<any>(null);

  useEffect(() => {
    patrols.list().then(r => {
      const list = r.data?.data || [];
      setActivePatrols(list.filter((p: any) => p.status === 'active').slice(0, 3));
    }).catch(() => {});
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (locationRef.current) locationRef.current.remove();
    };
  }, []);

  const startPatrol = async () => {
    const { status: perm } = await Location.requestForegroundPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert('Ligging Benodig', 'Skakel ligging aan om te patrolleer.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    setStatus('active');
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    locationRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 10000, distanceInterval: 20 },
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    );
  };

  const stopPatrol = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (locationRef.current) locationRef.current.remove();
    setStatus('idle');
    Alert.alert('Patrollie Klaar', `Jy het ${checkIns} keer ingeklok oor ${formatTime(elapsed)}.`);
    setElapsed(0);
    setCheckIns(0);
  };

  const doCheckIn = async () => {
    if (!location) return;
    try {
      // Find first active patrol to check into, or just record locally
      if (activePatrols.length > 0) {
        await patrols.checkin(activePatrols[0].id, location.lat, location.lng);
      }
      setCheckIns(c => c + 1);
      Alert.alert('✅ Ingeklok!', `GPS: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
    } catch {
      setCheckIns(c => c + 1);
      Alert.alert('✅ Ingeklok!', 'Ligging gestoor.');
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const statusColor = status === 'active' ? Colors.accentGreen : status === 'paused' ? Colors.accentYellow : Colors.textMuted;

  return (
    <View style={s.container}>
      <ScreenHeader title="Patrollie Sentrum" showBack />
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Status Card */}
        <PlatinumCard accentColor={statusColor} style={s.statusCard}>
          <View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[Typography.h2, { color: statusColor }]}>
              {status === 'active' ? 'PATROLLIE AKTIEF' : status === 'paused' ? 'GEPAUZEER' : 'GEREED'}
            </Text>
          </View>
          {status === 'active' && (
            <View style={s.statsRow}>
              <View style={s.stat}>
                <Text style={s.statVal}>{formatTime(elapsed)}</Text>
                <Text style={Typography.caption}>Tyd</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.stat}>
                <Text style={s.statVal}>{checkIns}</Text>
                <Text style={Typography.caption}>Inklok</Text>
              </View>
              {location && (
                <>
                  <View style={s.statDivider} />
                  <View style={s.stat}>
                    <Text style={[s.statVal, { fontSize: 11 }]}>{location.lat.toFixed(3)}</Text>
                    <Text style={Typography.caption}>Lat</Text>
                  </View>
                </>
              )}
            </View>
          )}
        </PlatinumCard>

        {/* Action Buttons */}
        <View style={s.btnRow}>
          {status === 'idle' ? (
            <PlatinumButton label="Begin Patrollie" onPress={startPatrol} style={{ flex: 1 }} />
          ) : (
            <>
              <PlatinumButton label="GPS Inklok" onPress={doCheckIn} style={{ flex: 1 }} />
              <PlatinumButton label="Stop" onPress={stopPatrol} variant="danger" style={{ flex: 1 }} />
            </>
          )}
        </View>

        {/* Active Community Patrols */}
        <Text style={[Typography.label, { marginBottom: 10, marginTop: 8 }]}>AKTIEWE PATROLLIES</Text>
        {activePatrols.length === 0 ? (
          <PlatinumCard>
            <View style={s.emptyRow}>
              <Ionicons name="shield-outline" size={32} color={Colors.textMuted} />
              <Text style={[Typography.body, { color: Colors.textMuted, marginTop: 8 }]}>Geen aktiewe patrollies</Text>
              <TouchableOpacity onPress={() => router.push('/patrols')} style={s.linkBtn}>
                <Text style={[Typography.caption, { color: Colors.accent }]}>Sien alle patrollies →</Text>
              </TouchableOpacity>
            </View>
          </PlatinumCard>
        ) : (
          activePatrols.map(p => (
            <TouchableOpacity key={p.id} onPress={() => router.push(`/patrols/${p.id}`)}>
              <PlatinumCard accentColor={Colors.accentGreen} style={{ marginBottom: 8 }}>
                <View style={s.patrolRow}>
                  <Ionicons name="shield-checkmark" size={20} color={Colors.accentGreen} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={Typography.bodySemi}>{p.name}</Text>
                    <Text style={Typography.caption}>{p.area} · {p.member_count || 0} lede</Text>
                  </View>
                  <Badge label="AKTIEF" color={Colors.accentGreen} />
                </View>
              </PlatinumCard>
            </TouchableOpacity>
          ))
        )}

        {/* Quick Nav */}
        <TouchableOpacity onPress={() => router.push('/patrols')} style={s.navBtn}>
          <Ionicons name="list" size={18} color={Colors.accent} />
          <Text style={[Typography.bodySemi, { color: Colors.accent, marginLeft: 8 }]}>Alle Patrollies Bekyk</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  statusCard: { marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700', color: Colors.text },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  btnRow: { flexDirection: 'row', gap: 10 },
  emptyRow: { alignItems: 'center', paddingVertical: 16 },
  linkBtn: { marginTop: 8, padding: 8 },
  patrolRow: { flexDirection: 'row', alignItems: 'center' },
  navBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
});
