import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Radius } from '@/theme';
import { PlatinumCard, ScreenHeader, SectionHeader, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import * as Location from 'expo-location';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function MovementCheckin() {
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
  const [location, setLocation] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState(false);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/movement/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { const d = await res.json(); setHistory(d.data || []); }
    } catch {}
  };

  const checkin = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Toestemming Geweier', 'Liggingtoestemming benodig'); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      await fetch(`${API_URL}/api/movement/checkin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: loc.coords.latitude, lng: loc.coords.longitude }),
      });
      Alert.alert('✅ Ingeskake', 'Jou ligging is gestoor.');
      loadHistory();
    } catch { Alert.alert('Fout', 'Kon nie inskakel nie.'); }
    finally { setLoading(false); }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Bewegings-DNA™" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: 20 }]}>
          Dorpwag™ leer jou normale bewegingspatrone en waarsku as iets abnormaal is.
        </Text>

        {/* Current Location */}
        <PlatinumCard accentColor={Colors.accentPurple} style={s.locationCard}>
          <View style={s.locationRow}>
            <View style={[s.locationIcon, { backgroundColor: Colors.accentPurple + '20' }]}>
              <Ionicons name="location" size={24} color={Colors.accentPurple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={Typography.bodySemi}>Huidige Ligging</Text>
              {location ? (
                <Text style={Typography.caption}>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</Text>
              ) : (
                <Text style={Typography.caption}>Nog nie bepaal nie</Text>
              )}
            </View>
            <Badge label={tracking ? 'AKTIEF' : 'INAKTIEF'} color={tracking ? Colors.accentGreen : Colors.textMuted} />
          </View>
        </PlatinumCard>

        {/* Checkin Button */}
        <TouchableOpacity onPress={checkin} disabled={loading} style={s.checkinBtn}>
          <LinearGradient colors={[Colors.accentPurple, Colors.primary]} style={s.checkinBtnInner}>
            <Ionicons name="location" size={20} color="#fff" />
            <Text style={[Typography.button, { marginLeft: 8 }]}>
              {loading ? 'Besig...' : 'Inskakel met Ligging'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* History */}
        <SectionHeader title="Bewegingsgeskiedenis" />
        {history.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="analytics-outline" size={40} color={Colors.textMuted} />
            <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 8 }]}>Geen geskiedenis nie</Text>
          </View>
        ) : (
          history.slice(0, 10).map((h: any, i: number) => (
            <PlatinumCard key={i} style={s.historyItem}>
              <View style={s.historyRow}>
                <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={Typography.bodySmall}>{h.lat?.toFixed(4)}, {h.lng?.toFixed(4)}</Text>
                  <Text style={Typography.caption}>{h.created_at ? new Date(h.created_at).toLocaleString('af-ZA') : ''}</Text>
                </View>
                {h.anomaly && <Badge label="ABNORMAAL" color={Colors.accentRed} />}
              </View>
            </PlatinumCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  locationCard: { marginBottom: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  checkinBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 24 },
  checkinBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  historyItem: { marginBottom: 6 },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
});
