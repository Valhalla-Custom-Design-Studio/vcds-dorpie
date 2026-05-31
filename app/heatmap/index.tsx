import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Heatmap, PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { reportsAPI } from '@/services/api';

interface HeatPoint { latitude: number; longitude: number; weight?: number; }

export default function HeatmapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [points, setPoints] = useState<HeatPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: -26.5, longitude: 28.1,
    latitudeDelta: 0.1, longitudeDelta: 0.1,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await reportsAPI.list();
        const data = res.data?.data || [];
        const pts: HeatPoint[] = data
          .filter((r: any) => r.latitude && r.longitude)
          .map((r: any) => ({
            latitude: parseFloat(r.latitude),
            longitude: parseFloat(r.longitude),
            weight: r.severity === 'high' ? 1.0 : r.severity === 'medium' ? 0.6 : 0.3,
          }));
        setPoints(pts);
        if (pts.length > 0) {
          setRegion(prev => ({ ...prev, latitude: pts[0].latitude, longitude: pts[0].longitude }));
        }
      } catch (e) {
        console.warn('Heatmap load error', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[Typography.h2, { flex: 1 }]}>🔥 Straat Hittemap</Text>
        <View style={s.legendRow}>
          <View style={[s.dot, { backgroundColor: Colors.accentGreen }]} />
          <Text style={s.legendText}>Laag</Text>
          <View style={[s.dot, { backgroundColor: Colors.accentYellow }]} />
          <Text style={s.legendText}>Medium</Text>
          <View style={[s.dot, { backgroundColor: Colors.accentRed }]} />
          <Text style={s.legendText}>Hoog</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 12 }]}>Laai veiligheidsdata...</Text>
        </View>
      ) : (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={s.map}
          region={region}
          customMapStyle={darkMapStyle}
          showsUserLocation
          showsMyLocationButton
        >
          {points.length > 0 && (
            <Heatmap
              points={points}
              opacity={0.8}
              radius={40}
              gradient={{
                colors: ['#00FF88', '#FFD700', '#FF3B30'],
                startPoints: [0.1, 0.5, 1.0],
                colorMapSize: 256,
              }}
            />
          )}
          {points.length === 0 && (
            <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
              <View style={s.emptyMarker}>
                <Ionicons name="checkmark-circle" size={32} color={Colors.accentGreen} />
              </View>
            </Marker>
          )}
        </MapView>
      )}

      {/* Stats pill */}
      <View style={[s.statsPill, { bottom: insets.bottom + 16 }]}>
        <Ionicons name="alert-circle" size={16} color={Colors.accentRed} />
        <Text style={s.statsText}>{points.length} voorvalle gemerk</Text>
      </View>
    </View>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2a3a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#021A1A' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.surface + 'EE',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'column',
    gap: 8,
  },
  backBtn: { padding: 4, marginBottom: 4 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: Colors.textMuted, fontSize: 11 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyMarker: { backgroundColor: Colors.surface, borderRadius: 20, padding: 4 },
  statsPill: {
    position: 'absolute', alignSelf: 'center',
    backgroundColor: Colors.surface + 'EE',
    borderRadius: Radius.pill,
    paddingHorizontal: 16, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.card,
  },
  statsText: { color: Colors.text, fontSize: 13, fontWeight: '600' },
});
