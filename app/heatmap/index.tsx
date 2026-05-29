import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  Dimensions, ScrollView, Animated,
} from 'react-native';
import MapView, { Heatmap, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Shadow } from '../../src/theme';
import { PlatinumCard, ScreenHeader, Badge } from '../../src/components/ui';
import { heatmapAPI, reportsAPI } from '../../src/services/api';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.45;

const RISK_COLORS: Record<string, string> = {
  high: Colors.red,
  medium: Colors.warning,
  low: Colors.success,
};

function getRisk(count: number): 'high' | 'medium' | 'low' {
  if (count >= 5) return 'high';
  if (count >= 3) return 'medium';
  return 'low';
}

export default function HeatmapScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [region, setRegion] = useState({
    latitude: -26.5, longitude: 28.0,
    latitudeDelta: 0.5, longitudeDelta: 0.5,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      // Get user location for map center
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setRegion(r => ({
          ...r,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }));
      }

      // Load incident data
      try {
        const [h, r] = await Promise.allSettled([heatmapAPI.get(), reportsAPI.list()]);
        if (r.status === 'fulfilled') setData(r.value.data.data || []);
      } finally {
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }
    })();
  }, []);

  // Build heatmap points from incidents that have lat/lng
  const heatPoints = data
    .filter(r => r.latitude && r.longitude)
    .map(r => ({
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
      weight: r.severity === 'high' ? 3 : r.severity === 'medium' ? 2 : 1,
    }));

  // Group by area for list view
  const byArea: Record<string, any[]> = {};
  data.forEach(r => {
    const area = r.address || r.area || 'Unknown Area';
    if (!byArea[area]) byArea[area] = [];
    byArea[area].push(r);
  });

  const isEmpty = data.length === 0;

  return (
    <View style={s.container}>
      <ScreenHeader title="Safety Heatmap" showBack />

      {/* View Toggle */}
      <View style={s.toggleRow}>
        <TouchableOpacity
          style={[s.toggleBtn, view === 'map' && s.toggleActive]}
          onPress={() => setView('map')}
        >
          <Ionicons name="map" size={16} color={view === 'map' ? Colors.accent : Colors.textMuted} />
          <Text style={[s.toggleText, view === 'map' && { color: Colors.accent }]}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.toggleBtn, view === 'list' && s.toggleActive]}
          onPress={() => setView('list')}
        >
          <Ionicons name="list" size={16} color={view === 'list' ? Colors.accent : Colors.textMuted} />
          <Text style={[s.toggleText, view === 'list' && { color: Colors.accent }]}>List</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={[Typography.caption, { marginTop: 12 }]}>Loading safety data...</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {view === 'map' ? (
            <View style={{ flex: 1 }}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={s.map}
                region={region}
                onRegionChangeComplete={setRegion}
                showsUserLocation
                showsMyLocationButton
                customMapStyle={darkMapStyle}
              >
                {/* Heatmap overlay */}
                {heatPoints.length > 0 && (
                  <Heatmap
                    points={heatPoints}
                    opacity={0.7}
                    radius={40}
                    gradient={{
                      colors: ['#22C55E', '#F59E0B', '#DC2626'],
                      startPoints: [0.1, 0.5, 1.0],
                      colorMapSize: 256,
                    }}
                  />
                )}

                {/* Individual incident markers */}
                {data.filter(r => r.latitude && r.longitude).map((r, i) => (
                  <Marker
                    key={r.id || i}
                    coordinate={{
                      latitude: parseFloat(r.latitude),
                      longitude: parseFloat(r.longitude),
                    }}
                    title={r.title || r.category}
                    description={r.address || ''}
                    pinColor={RISK_COLORS[r.severity] || Colors.warning}
                  />
                ))}
              </MapView>

              {/* Legend overlay */}
              <View style={s.legendOverlay}>
                {[
                  { color: Colors.success, label: 'Low' },
                  { color: Colors.warning, label: 'Medium' },
                  { color: Colors.red, label: 'High' },
                ].map(l => (
                  <View key={l.label} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: l.color }]} />
                    <Text style={s.legendText}>{l.label}</Text>
                  </View>
                ))}
              </View>

              {/* Empty state overlay on map */}
              {isEmpty && (
                <View style={s.mapEmptyOverlay}>
                  <View style={s.mapEmptyCard}>
                    <Text style={{ fontSize: 36 }}>🟢</Text>
                    <Text style={[Typography.h3, { marginTop: 8, textAlign: 'center' }]}>All Clear</Text>
                    <Text style={[Typography.caption, { textAlign: 'center', marginTop: 4 }]}>
                      No incidents reported in your area
                    </Text>
                  </View>
                </View>
              )}

              {/* Stats bar */}
              <View style={s.statsBar}>
                <View style={s.statItem}>
                  <Text style={s.statNum}>{data.length}</Text>
                  <Text style={s.statLabel}>Total</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={[s.statNum, { color: Colors.red }]}>
                    {data.filter(r => r.severity === 'high').length}
                  </Text>
                  <Text style={s.statLabel}>High Risk</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={[s.statNum, { color: Colors.warning }]}>
                    {data.filter(r => r.severity === 'medium').length}
                  </Text>
                  <Text style={s.statLabel}>Medium</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statItem}>
                  <Text style={[s.statNum, { color: Colors.success }]}>
                    {data.filter(r => r.severity === 'low' || !r.severity).length}
                  </Text>
                  <Text style={s.statLabel}>Low</Text>
                </View>
              </View>
            </View>
          ) : (
            /* List View */
            <ScrollView contentContainerStyle={s.scroll}>
              <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: 16 }]}>
                Incident frequency by area · past 30 days
              </Text>

              {Object.entries(byArea)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([area, incidents]) => {
                  const risk = getRisk(incidents.length);
                  return (
                    <PlatinumCard key={area} style={s.areaCard}>
                      <View style={s.areaRow}>
                        <View style={[s.areaDot, { backgroundColor: RISK_COLORS[risk] }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={Typography.bodySemi}>{area}</Text>
                          <Text style={Typography.caption}>
                            {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        <Badge
                          label={risk.toUpperCase()}
                          variant={risk === 'high' ? 'error' : risk === 'medium' ? 'warning' : 'success'}
                        />
                      </View>
                      {/* Mini bar */}
                      <View style={s.barBg}>
                        <View style={[
                          s.barFill,
                          {
                            width: `${Math.min((incidents.length / 10) * 100, 100)}%` as any,
                            backgroundColor: RISK_COLORS[risk],
                          }
                        ]} />
                      </View>
                    </PlatinumCard>
                  );
                })}

              {isEmpty && (
                <View style={s.listEmpty}>
                  <Text style={{ fontSize: 48 }}>🟢</Text>
                  <Text style={[Typography.h3, { marginTop: 12 }]}>All Clear</Text>
                  <Text style={[Typography.body, { color: Colors.textMuted, textAlign: 'center', marginTop: 8 }]}>
                    No incidents reported in your area recently.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </Animated.View>
      )}
    </View>
  );
}

// Google Maps dark style matching VCDS theme
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0B0612' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8B7BA0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0612' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1A0F2E' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2D1B4E' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1A0F2E' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4C1D95' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#110920' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toggleRow: {
    flexDirection: 'row', margin: 16, marginBottom: 8,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: 4, gap: 4,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: Radius.md,
  },
  toggleActive: { backgroundColor: Colors.bgSecondary, ...Shadow.sm },
  toggleText: { ...Typography.caption, color: Colors.textMuted, fontSize: 13 },
  map: { width, height: MAP_HEIGHT },
  legendOverlay: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(11,6,18,0.85)', borderRadius: Radius.md,
    padding: 10, gap: 6,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...Typography.caption, fontSize: 11 },
  mapEmptyOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  mapEmptyCard: {
    backgroundColor: 'rgba(11,6,18,0.9)', borderRadius: Radius.xl,
    padding: 24, alignItems: 'center', borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  statsBar: {
    flexDirection: 'row', backgroundColor: Colors.bgSecondary,
    paddingVertical: 12, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: Colors.surfaceBorder,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { ...Typography.h3, fontSize: 22, color: Colors.textHeading },
  statLabel: { ...Typography.caption, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.surfaceBorder, marginVertical: 4 },
  scroll: { padding: 16, paddingBottom: 32 },
  areaCard: { marginBottom: 8 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  areaDot: { width: 12, height: 12, borderRadius: 6 },
  barBg: { height: 4, backgroundColor: Colors.surface, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
  listEmpty: { alignItems: 'center', paddingTop: 48 },
});
