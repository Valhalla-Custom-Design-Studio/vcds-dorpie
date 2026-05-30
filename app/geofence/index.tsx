import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, Switch, TextInput, ActivityIndicator,
} from 'react-native';
import MapView, { Circle, Marker, MapPressEvent, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { PlatinumCard, PlatinumButton, ScreenHeader, EmptyState } from '@/components/ui';
import { api } from '@/services/api';
import { t } from '@/i18n';

interface GeoFence {
  id: string;
  label: string;
  lat: number;
  lng: number;
  radius: number; // metres
  active: boolean;
  notify_on_exit: boolean;
  notify_on_enter: boolean;
  linked_user_id?: string;
  linked_user_name?: string;
}

export default function GeoFenceScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [fences, setFences] = useState<GeoFence[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newFence, setNewFence] = useState<{ lat: number; lng: number; radius: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/geofence');
      setFences(data.fences || []);
    } catch { /* offline */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleMapPress = (e: MapPressEvent) => {
    if (!creating) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setNewFence({ lat: latitude, lng: longitude, radius: 200, label: '' });
  };

  const saveFence = async () => {
    if (!newFence?.label) { Alert.alert(t('common.error'), t('geofence.labelRequired')); return; }
    setSaving(true);
    try {
      await api.post('/geofence', {
        label: newFence.label,
        lat: newFence.lat,
        lng: newFence.lng,
        radius: newFence.radius,
        notify_on_exit: true,
        notify_on_enter: false,
      });
      setNewFence(null);
      setCreating(false);
      await load();
      Alert.alert(t('common.confirm'), t('geofence.saveSuccess'));
    } catch {
      Alert.alert(t('common.error'), t('geofence.saveFailed'));
    } finally { setSaving(false); }
  };

  const toggleFence = async (id: string, active: boolean) => {
    try {
      await api.patch(\`/geofence/\${id}\`, { active });
      setFences(prev => prev.map(f => f.id === id ? { ...f, active } : f));
    } catch { Alert.alert(t('error'), t('geofenceToggleFailed')); }
  };

  const deleteFence = (id: string) => {
    Alert.alert(t('confirm'), t('geofenceDeleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: async () => {
        try {
          await api.delete(\`/geofence/\${id}\`);
          setFences(prev => prev.filter(f => f.id !== id));
        } catch { Alert.alert(t('error'), t('geofenceDeleteFailed')); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('geofenceTitle')} onBack={() => router.back()} />

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          onPress={handleMapPress}
          initialRegion={{ latitude: -26.5, longitude: 28.0, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        >
          {fences.map(f => (
            <React.Fragment key={f.id}>
              <Circle
                center={{ latitude: f.lat, longitude: f.lng }}
                radius={f.radius}
                fillColor={f.active ? 'rgba(99,102,241,0.15)' : 'rgba(100,100,100,0.1)'}
                strokeColor={f.active ? Colors.accent : Colors.border}
                strokeWidth={2}
              />
              <Marker coordinate={{ latitude: f.lat, longitude: f.lng }} title={f.label} />
            </React.Fragment>
          ))}
          {newFence && (
            <>
              <Circle
                center={{ latitude: newFence.lat, longitude: newFence.lng }}
                radius={newFence.radius}
                fillColor="rgba(99,102,241,0.2)"
                strokeColor={Colors.accent}
                strokeWidth={2}
              />
              <Marker coordinate={{ latitude: newFence.lat, longitude: newFence.lng }} pinColor="blue" />
            </>
          )}
        </MapView>

        <TouchableOpacity
          style={[styles.createBtn, creating && styles.createBtnActive]}
          onPress={() => { setCreating(!creating); setNewFence(null); }}
        >
          <Ionicons name={creating ? 'close' : 'add'} size={22} color="#fff" />
          <Text style={styles.createBtnText}>{creating ? t('cancel') : t('geofenceAdd')}</Text>
        </TouchableOpacity>
      </View>

      {/* New fence form */}
      {newFence && (
        <PlatinumCard style={styles.formCard}>
          <Text style={styles.formTitle}>{t('geofenceNew')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('geofenceLabelPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            value={newFence.label}
            onChangeText={v => setNewFence(prev => prev ? { ...prev, label: v } : null)}
          />
          <Text style={styles.radiusLabel}>{t('geofenceRadius')}: {newFence.radius}m</Text>
          <View style={styles.radiusRow}>
            {[100, 200, 500, 1000].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusChip, newFence.radius === r && styles.radiusChipActive]}
                onPress={() => setNewFence(prev => prev ? { ...prev, radius: r } : null)}
              >
                <Text style={[styles.radiusChipText, newFence.radius === r && styles.radiusChipTextActive]}>
                  {r >= 1000 ? \`\${r/1000}km\` : \`\${r}m\`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <PlatinumButton title={saving ? t('saving') : t('geofenceSave')} onPress={saveFence} loading={saving} />
        </PlatinumCard>
      )}

      {/* Fence list */}
      <ScrollView style={styles.list} contentContainerStyle={{ padding: Spacing.md }}>
        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: 40 }} />
        ) : fences.length === 0 ? (
          <EmptyState
            icon="location-outline"
            title={t('geofenceEmpty')}
            subtitle={t('geofenceEmptySubtitle')}
            ctaLabel={t('geofenceAdd')}
            onCta={() => setCreating(true)}
          />
        ) : fences.map(f => (
          <PlatinumCard key={f.id} style={styles.fenceCard}>
            <View style={styles.fenceRow}>
              <Ionicons name="location" size={20} color={f.active ? Colors.accent : Colors.textMuted} />
              <View style={styles.fenceInfo}>
                <Text style={styles.fenceLabel}>{f.label}</Text>
                <Text style={styles.fenceMeta}>{f.radius}m radius</Text>
                {f.linked_user_name && (
                  <Text style={styles.fenceLinked}>👤 {f.linked_user_name}</Text>
                )}
              </View>
              <Switch
                value={f.active}
                onValueChange={v => toggleFence(f.id, v)}
                trackColor={{ true: Colors.accent, false: Colors.border }}
                thumbColor="#fff"
              />
              <TouchableOpacity onPress={() => deleteFence(f.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          </PlatinumCard>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  mapContainer: { height: 280, position: 'relative' },
  map: { flex: 1 },
  createBtn: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    paddingHorizontal: 16, paddingVertical: 10,
    ...Shadow.glow,
  },
  createBtnActive: { backgroundColor: Colors.error },
  createBtnText: { color: '#fff', ...Typography.labelMd, fontWeight: '700' },
  formCard: { margin: Spacing.md, padding: Spacing.md },
  formTitle: { ...Typography.titleSm, color: Colors.text, marginBottom: Spacing.sm },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.text, padding: Spacing.sm, marginBottom: Spacing.sm,
    ...Typography.bodyMd,
  },
  radiusLabel: { ...Typography.labelSm, color: Colors.textMuted, marginBottom: 6 },
  radiusRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  radiusChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
  },
  radiusChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  radiusChipText: { ...Typography.labelSm, color: Colors.textMuted },
  radiusChipTextActive: { color: '#fff' },
  list: { flex: 1 },
  fenceCard: { marginBottom: Spacing.sm, padding: Spacing.md },
  fenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fenceInfo: { flex: 1 },
  fenceLabel: { ...Typography.labelMd, color: Colors.text, fontWeight: '700' },
  fenceMeta: { ...Typography.labelSm, color: Colors.textMuted },
  fenceLinked: { ...Typography.labelSm, color: Colors.accent, marginTop: 2 },
  deleteBtn: { padding: 6 },
});
