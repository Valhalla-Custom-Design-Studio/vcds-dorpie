import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { api } from '@/services/api';

export default function GeofenceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fences, setFences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/geofence');
      setFences(res.data.fences || []);
    } catch {
      setFences([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggle = async (id: string, active: boolean) => {
    try {
      await api.patch(`/geofence/${id}`, { active });
      setFences(f => f.map(x => x.id === id ? { ...x, active } : x));
    } catch {
      Alert.alert('Fout', 'Kon nie opdateer nie.');
    }
  };

  const remove = async (id: string) => {
    Alert.alert('Verwyder', 'Verwyder hierdie omheining?', [
      { text: 'Kanselleer', style: 'cancel' },
      {
        text: 'Verwyder', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/geofence/${id}`);
            setFences(f => f.filter(x => x.id !== id));
          } catch {
            Alert.alert('Fout', 'Kon nie verwyder nie.');
          }
        },
      },
    ]);
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textHeading} />
        </TouchableOpacity>
        <Text style={Typography.h3}>GeoOmheining™</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        >
          <View style={s.infoBanner}>
            <Ionicons name="location" size={18} color={Colors.accentBlue} />
            <Text style={[Typography.bodySmall, { color: Colors.textBody, flex: 1 }]}>
              Stel virtuele omheinings in. Ontvang 'n kennisgewing wanneer iemand die area betree of verlaat.
            </Text>
          </View>

          {fences.length === 0 && (
            <View style={s.empty}>
              <Ionicons name="map-outline" size={48} color={Colors.textMuted} />
              <Text style={[Typography.body, { color: Colors.textMuted, marginTop: 12, textAlign: 'center' }]}>
                Geen omheinings opgestel nie.{'\n'}Voeg jou eerste GeoOmheining by.
              </Text>
            </View>
          )}

          {fences.map(fence => (
            <View key={fence.id} style={s.fenceCard}>
              <View style={s.fenceRow}>
                <View style={[s.iconWrap, { backgroundColor: Colors.accentBlue + '22' }]}>
                  <Ionicons name="location" size={20} color={Colors.accentBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={Typography.bodySemi}>{fence.label}</Text>
                  <Text style={[Typography.caption, { color: Colors.textMuted }]}>
                    Radius: {fence.radius}m
                    {fence.linked_user_name ? ` · ${fence.linked_user_name}` : ''}
                  </Text>
                </View>
                <Switch
                  value={fence.active}
                  onValueChange={v => toggle(fence.id, v)}
                  trackColor={{ false: Colors.surface, true: Colors.accentBlue }}
                  thumbColor="#fff"
                />
                <TouchableOpacity onPress={() => remove(fence.id)} style={{ marginLeft: 8 }}>
                  <Ionicons name="trash-outline" size={18} color={Colors.accentRed} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  infoBanner: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.accentBlue + '15',
    borderWidth: 1, borderColor: Colors.accentBlue + '30',
    borderRadius: Radius.md, padding: Spacing.md,
  },
  empty: { alignItems: 'center', paddingTop: 48 },
  fenceCard: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  fenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
});
