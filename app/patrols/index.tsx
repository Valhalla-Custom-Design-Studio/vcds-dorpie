import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Dimensions, Animated,
} from 'react-native';
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Shadow } from '../../src/theme';
import { PlatinumCard, Badge, ScreenHeader, EmptyState } from '../../src/components/ui';
import { patrols } from '../../src/services/api';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.38;

export default function Patrols() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('map');
  const [region, setRegion] = useState({
    latitude: -26.5, longitude: 28.0,
    latitudeDelta: 0.15, longitudeDelta: 0.15,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const load = async () => {
    try {
      const { data } = await patrols.list();
      setList(data.data || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setRegion(r => ({
          ...r,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        }));
      }
      await load();
    })();
  }, []);

  const activePatrols = list.filter(p => p.status === 'active');
  const isEmpty = list.length === 0;

  return (
    <View style={s.container}>
      <ScreenHeader title="Neighbourhood Patrols" showBack />

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
              {/* Active patrol markers */}
              {activePatrols.map((p, i) =>
                p.latitude && p.longitude ? (
                  <React.Fragment key={p.id || i}>
                    <Marker
                      coordinate={{
                        latitude: parseFloat(p.latitude),
                        longitude: parseFloat(p.longitude),
                      }}
                      title={p.name}
                      description={`${p.member_count || 0} members · ${p.area}`}
                    >
                      <View style={s.patrolMarker}>
                        <Ionicons name="shield-checkmark" size={18} color="#fff" />
                      </View>
                    </Marker>
                    {/* Coverage radius */}
                    <Circle
                      center={{
                        latitude: parseFloat(p.latitude),
                        longitude: parseFloat(p.longitude),
                      }}
                      radius={500}
                      fillColor="rgba(34,197,94,0.08)"
                      strokeColor="rgba(34,197,94,0.4)"
                      strokeWidth={1.5}
                    />
                  </React.Fragment>
                ) : null
              )}
            </MapView>

            {/* Live badge */}
            {activePatrols.length > 0 && (
              <View style={s.liveBadge}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>{activePatrols.length} LIVE PATROL{activePatrols.length !== 1 ? 'S' : ''}</Text>
              </View>
            )}

            {/* Empty state on map */}
            {isEmpty && (
              <View style={s.mapEmptyOverlay}>
                <View style={s.mapEmptyCard}>
                  <Ionicons name="shield-checkmark-outline" size={40} color={Colors.textMuted} />
                  <Text style={[Typography.h3, { marginTop: 12, textAlign: 'center' }]}>No Active Patrols</Text>
                  <Text style={[Typography.caption, { textAlign: 'center', marginTop: 6 }]}>
                    Start a patrol to protect your community
                  </Text>
                </View>
              </View>
            )}

            {/* Patrol list below map */}
            <FlatList
              data={list}
              keyExtractor={i => i.id}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => { setRefreshing(true); load(); }}
                  tintColor={Colors.primary}
                />
              }
              ListEmptyComponent={
                !loading ? (
                  <EmptyState
                    icon="shield-checkmark-outline"
                    title="No active patrols"
                    subtitle="Patrols keep your community safe"
                  />
                ) : null
              }
              renderItem={({ item }) => <PatrolCard item={item} onPress={() => router.push(`/patrols/${item.id}`)} />}
              contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 8, flexGrow: 1 }}
            />
          </View>
        ) : (
          /* List-only view */
          <FlatList
            data={list}
            keyExtractor={i => i.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(); }}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={
              !loading ? (
                <EmptyState
                  icon="shield-checkmark-outline"
                  title="No active patrols"
                  subtitle="Patrols keep your community safe"
                />
              ) : null
            }
            renderItem={({ item }) => <PatrolCard item={item} onPress={() => router.push(`/patrols/${item.id}`)} />}
            contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 8, flexGrow: 1 }}
          />
        )}
      </Animated.View>
    </View>
  );
}

function PatrolCard({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <PlatinumCard>
        <View style={s.row}>
          <View style={[s.icon, { backgroundColor: item.status === 'active' ? Colors.success + '20' : Colors.surface }]}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={item.status === 'active' ? Colors.success : Colors.textMuted}
            />
          </View>
          <View style={s.content}>
            <Text style={Typography.bodySemi}>{item.name}</Text>
            <Text style={Typography.caption}>{item.area} · {item.member_count || 0} members</Text>
            <Text style={[Typography.caption, { color: Colors.textMuted }]}>
              {item.start_time
                ? `Starts: ${new Date(item.start_time).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`
                : 'Ongoing'}
            </Text>
          </View>
          <Badge
            label={item.status === 'active' ? 'LIVE' : item.status?.toUpperCase() || 'SCHEDULED'}
            variant={item.status === 'active' ? 'success' : 'muted'}
          />
        </View>
      </PlatinumCard>
    </TouchableOpacity>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0B0612' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8B7BA0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B0612' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1A0F2E' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2D1B4E' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4C1D95' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#110920' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
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
  toggleText: { fontSize: 13, fontWeight: '500' as const, color: Colors.textMuted },
  map: { width, height: MAP_HEIGHT },
  patrolMarker: {
    backgroundColor: Colors.success, borderRadius: 20,
    padding: 8, borderWidth: 2, borderColor: '#fff',
    ...Shadow.md,
  },
  liveBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(11,6,18,0.85)', borderRadius: Radius.md,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.success + '60',
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveText: { fontSize: 11, fontWeight: '700' as const, color: Colors.success, letterSpacing: 0.5 },
  mapEmptyOverlay: {
    position: 'absolute', top: 0, left: 0, right: width, bottom: 0,
    width, height: MAP_HEIGHT,
    alignItems: 'center', justifyContent: 'center',
  },
  mapEmptyCard: {
    backgroundColor: 'rgba(11,6,18,0.9)', borderRadius: Radius.xl,
    padding: 24, alignItems: 'center', borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
});
