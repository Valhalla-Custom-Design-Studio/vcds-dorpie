import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { patrols } from '@/services/api';

interface Patrol {
  id: string; user_name?: string; status: string;
  start_lat?: number; start_lng?: number;
  route?: { latitude: number; longitude: number }[];
  started_at?: string;
}

export default function PatrolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [patrolList, setPatrolList] = useState<Patrol[]>([]);
  const [selected, setSelected] = useState<Patrol | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'map' | 'list'>('map');

  const region = {
    latitude: selected?.start_lat || -26.5,
    longitude: selected?.start_lng || 28.1,
    latitudeDelta: 0.05, longitudeDelta: 0.05,
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await patrols.list();
        const data = res.data?.data || [];
        setPatrolList(data);
        if (data.length > 0) setSelected(data[0]);
      } catch (e) {
        console.warn('Patrols load error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activePatrols = patrolList.filter(p => p.status === 'active');
  const completedPatrols = patrolList.filter(p => p.status !== 'active');

  return (
    <View style={s.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.accentGreen + '22', Colors.bg]}
        style={[s.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={[Typography.h2, { flex: 1 }]}>🛡️ Patrollies</Text>
          <View style={s.badge}>
            <Text style={s.badgeText}>{activePatrols.length} aktief</Text>
          </View>
        </View>

        {/* Toggle */}
        <View style={s.toggle}>
          {(['map', 'list'] as const).map(v => (
            <TouchableOpacity
              key={v}
              style={[s.toggleBtn, view === v && s.toggleActive]}
              onPress={() => setView(v)}
            >
              <Ionicons name={v === 'map' ? 'map' : 'list'} size={16} color={view === v ? Colors.bg : Colors.textMuted} />
              <Text style={[s.toggleText, view === v && { color: Colors.bg }]}>
                {v === 'map' ? 'Kaart' : 'Lys'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.accentGreen} />
          <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 12 }]}>Laai patrollies...</Text>
        </View>
      ) : view === 'map' ? (
        <View style={{ flex: 1 }}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={s.map}
            region={region}
            customMapStyle={darkMapStyle}
            showsUserLocation
          >
            {patrolList.map(p => p.start_lat && p.start_lng ? (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.start_lat, longitude: p.start_lng }}
                onPress={() => setSelected(p)}
              >
                <View style={[s.markerPin, { backgroundColor: p.status === 'active' ? Colors.accentGreen : Colors.textMuted }]}>
                  <Ionicons name="shield-checkmark" size={14} color="#fff" />
                </View>
              </Marker>
            ) : null)}
            {selected?.route && selected.route.length > 1 && (
              <Polyline
                coordinates={selected.route}
                strokeColor={Colors.accentGreen}
                strokeWidth={3}
              />
            )}
          </MapView>

          {/* Selected patrol card */}
          {selected && (
            <View style={[s.selectedCard, { bottom: insets.bottom + 16 }]}>
              <View style={[s.statusDot, { backgroundColor: selected.status === 'active' ? Colors.accentGreen : Colors.textMuted }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.patrolName}>{selected.user_name || 'Onbekende Wag'}</Text>
                <Text style={s.patrolStatus}>{selected.status === 'active' ? '🟢 Aktief' : '⚫ Voltooi'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}>
          {activePatrols.length > 0 && (
            <>
              <Text style={[Typography.label, { color: Colors.accentGreen, marginBottom: 8 }]}>AKTIEWE PATROLLIES</Text>
              {activePatrols.map(p => (
                <TouchableOpacity key={p.id} style={s.listCard} onPress={() => { setSelected(p); setView('map'); }}>
                  <View style={[s.statusDot, { backgroundColor: Colors.accentGreen }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.patrolName}>{p.user_name || 'Onbekende Wag'}</Text>
                    <Text style={s.patrolStatus}>Sedert {p.started_at ? new Date(p.started_at).toLocaleTimeString('af-ZA', { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
                  </View>
                  <Ionicons name="map-outline" size={18} color={Colors.primary} />
                </TouchableOpacity>
              ))}
            </>
          )}
          {completedPatrols.length > 0 && (
            <>
              <Text style={[Typography.label, { color: Colors.textMuted, marginTop: 16, marginBottom: 8 }]}>GESKIEDENIS</Text>
              {completedPatrols.slice(0, 10).map(p => (
                <View key={p.id} style={[s.listCard, { opacity: 0.6 }]}>
                  <View style={[s.statusDot, { backgroundColor: Colors.textMuted }]} />
                  <Text style={s.patrolName}>{p.user_name || 'Onbekende Wag'}</Text>
                </View>
              ))}
            </>
          )}
          {patrolList.length === 0 && (
            <View style={s.center}>
              <Ionicons name="shield-outline" size={48} color={Colors.textMuted} />
              <Text style={[Typography.body, { color: Colors.textMuted, marginTop: 12, textAlign: 'center' }]}>
                Geen aktiewe patrollies nie.{'
'}Wees die eerste om te begin!
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2a3a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#021A1A' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: { padding: 4, marginRight: 8 },
  badge: { backgroundColor: Colors.accentGreen + '33', borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: Colors.accentGreen, fontSize: 12, fontWeight: '700' },
  toggle: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 3, alignSelf: 'flex-start' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.sm },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  markerPin: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  selectedCard: {
    position: 'absolute', left: 16, right: 16,
    backgroundColor: Colors.surface + 'EE',
    borderRadius: Radius.lg, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.accentGreen + '44',
    ...Shadow.card,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  patrolName: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  patrolStatus: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  listCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
});
