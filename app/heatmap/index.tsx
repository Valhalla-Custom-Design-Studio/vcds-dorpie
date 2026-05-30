import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import MapView, { Heatmap, PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '@/theme';
import { PlatinumCard, ScreenHeader, Badge, SectionHeader } from '@/components/ui';
import { heatmapAPI, reportsAPI } from '@/services/api';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 260;

const RISK_COLOR = (count: number) =>
  count >= 5 ? Colors.accentRed : count >= 3 ? Colors.accentOrange : count >= 1 ? Colors.accentYellow : Colors.accentGreen;

const RISK_LABEL = (count: number) =>
  count >= 5 ? 'HOOG' : count >= 3 ? 'MEDIUM' : count >= 1 ? 'LAAG' : 'VEILIG';

// Default center: Heidelberg, Gauteng
const DEFAULT_REGION = {
  latitude: -26.5,
  longitude: 28.36,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function Heatmap() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('map');

  useEffect(() => {
    Promise.allSettled([heatmapAPI.get(), reportsAPI.list()])
      .then(([h, r]) => {
        const reports = r.status === 'fulfilled' ? (r.value.data.data || []) : [];
        const heatData = h.status === 'fulfilled' ? (h.value.data.data || []) : [];
        // Merge: prefer heatmap data, fall back to reports with coords
        const combined = [
          ...heatData,
          ...reports.filter((rep: any) => rep.latitude && rep.longitude),
        ];
        setData(combined);
      })
      .finally(() => setLoading(false));
  }, []);

  // Build heatmap points for react-native-maps
  const heatPoints = data
    .filter(d => d.latitude && d.longitude)
    .map(d => ({
      latitude: parseFloat(d.latitude),
      longitude: parseFloat(d.longitude),
      weight: d.severity === 'high' ? 1 : d.severity === 'medium' ? 0.6 : 0.3,
    }));

  // Group by area for list view
  const byArea: Record<string, any[]> = {};
  data.forEach(r => {
    const area = r.address || r.area || 'Onbekende Area';
    if (!byArea[area]) byArea[area] = [];
    byArea[area].push(r);
  });
  const sorted = Object.entries(byArea).sort((a, b) => b[1].length - a[1].length);

  return (
    <View style={s.container}>
      <ScreenHeader title="Veiligheids Hittemap" showBack />

      {/* Toggle */}
      <View style={s.toggle}>
        {(['map', 'list'] as const).map(v => (
          <TouchableOpacity
            key={v}
            style={[s.toggleBtn, view === v && s.toggleActive]}
            onPress={() => setView(v)}
          >
            <Ionicons
              name={v === 'map' ? 'map' : 'list'}
              size={16}
              color={view === v ? Colors.text : Colors.textMuted}
            />
            <Text style={[Typography.caption, { color: view === v ? Colors.text : Colors.textMuted, marginLeft: 4 }]}>
              {v === 'map' ? 'Kaart' : 'Lys'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 48 }} />
      ) : view === 'map' ? (
        <View style={s.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={s.map}
            initialRegion={DEFAULT_REGION}
            onMapReady={() => setMapReady(true)}
            customMapStyle={DARK_MAP_STYLE}
          >
            {mapReady && heatPoints.length > 0 && (
              <Heatmap
                points={heatPoints}
                radius={40}
                opacity={0.8}
                gradient={{
                  colors: ['#00FF00', '#FFFF00', '#FF8C00', '#FF0000'],
                  startPoints: [0.1, 0.4, 0.7, 1.0],
                  colorMapSize: 256,
                }}
              />
            )}
            {/* Markers for individual incidents */}
            {mapReady && heatPoints.slice(0, 20).map((pt, i) => (
              <Marker
                key={i}
                coordinate={{ latitude: pt.latitude, longitude: pt.longitude }}
                pinColor={Colors.accentRed}
              />
            ))}
          </MapView>
          {heatPoints.length === 0 && mapReady && (
            <View style={s.mapOverlay}>
              <Text style={[Typography.caption, { color: Colors.textMuted }]}>Geen voorvalle met GPS-koördinate nie</Text>
            </View>
          )}
          {/* Legend overlay */}
          <View style={s.legendOverlay}>
            {[
              { color: Colors.accentGreen, label: 'Veilig' },
              { color: Colors.accentYellow, label: 'Laag' },
              { color: Colors.accentOrange, label: 'Medium' },
              { color: Colors.accentRed, label: 'Hoog' },
            ].map(l => (
              <View key={l.label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: l.color }]} />
                <Text style={[Typography.caption, { fontSize: 10 }]}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          <PlatinumCard style={s.legend}>
            <Text style={[Typography.label, { marginBottom: 10 }]}>RISIKO VLAKKE</Text>
            <View style={s.legendRow}>
              {[
                { color: Colors.accentGreen, label: 'Veilig (0)' },
                { color: Colors.accentYellow, label: 'Laag (1–2)' },
                { color: Colors.accentOrange, label: 'Medium (3–4)' },
                { color: Colors.accentRed, label: 'Hoog (5+)' },
              ].map(l => (
                <View key={l.label} style={s.legendRowItem}>
                  <View style={[s.legendDot, { backgroundColor: l.color }]} />
                  <Text style={Typography.caption}>{l.label}</Text>
                </View>
              ))}
            </View>
          </PlatinumCard>

          <SectionHeader title={`${sorted.length} Areas Gemonitor`} />

          {sorted.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="map-outline" size={48} color={Colors.textMuted} />
              <Text style={[Typography.body, { color: Colors.textMuted, marginTop: 12 }]}>Geen data beskikbaar nie</Text>
            </View>
          ) : (
            sorted.map(([area, incidents]) => {
              const count = incidents.length;
              const color = RISK_COLOR(count);
              return (
                <PlatinumCard key={area} accentColor={color} style={s.areaCard}>
                  <View style={s.areaRow}>
                    <View style={[s.areaBar, { backgroundColor: color + '30', borderColor: color + '60' }]}>
                      <View style={[s.areaFill, { backgroundColor: color, width: `${Math.min(count * 20, 100)}%` as any }]} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={Typography.bodySemi} numberOfLines={1}>{area}</Text>
                      <Text style={Typography.caption}>{count} voorval{count !== 1 ? 'le' : ''}</Text>
                    </View>
                    <Badge label={RISK_LABEL(count)} color={color} />
                  </View>
                </PlatinumCard>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

// Google Maps dark style
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0B0612' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  toggle: { flexDirection: 'row', margin: 16, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 4 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: Radius.sm },
  toggleActive: { backgroundColor: Colors.bg },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  mapOverlay: { position: 'absolute', bottom: 16, left: 16, right: 16, alignItems: 'center' },
  legendOverlay: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(11,6,18,0.85)', borderRadius: Radius.sm,
    padding: 8, gap: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  legend: { marginBottom: 16 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendRowItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  areaCard: { marginBottom: 8 },
  areaRow: { flexDirection: 'row', alignItems: 'center' },
  areaBar: { width: 60, height: 8, borderRadius: 4, borderWidth: 1, overflow: 'hidden' },
  areaFill: { height: '100%', borderRadius: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
});
