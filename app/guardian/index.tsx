import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/theme';
import { PlatinumCard, Badge, ScreenHeader, EmptyState } from '@/components/ui';
import { guardianAPI } from '@/services/api';

export default function Guardian() {
  const router = useRouter();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await guardianAPI.devices(); setDevices(data.data || []); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const removeDevice = (id: string, name: string) => {
    Alert.alert(`Remove ${name}?`, 'This will stop tracking this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await guardianAPI.removeDevice(id);
        await load();
      }},
    ]);
  };

  return (
    <View style={s.container}>
      <ScreenHeader title="Guardian Tracking" showBack right={
        <TouchableOpacity onPress={() => router.push('/guardian/add-device')}><Ionicons name="add-circle" size={28} color={Colors.primary} /></TouchableOpacity>
      } />
      <FlatList
        data={devices}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? (
          <EmptyState icon="people-outline" title="No tracked devices"
            subtitle="Add a device to monitor loved ones' locations"
            actionLabel="Add Device" onAction={() => router.push('/guardian/add-device')} />
        ) : null}
        renderItem={({ item }) => (
          <PlatinumCard style={s.card}>
            <View style={s.row}>
              <View style={s.avatar}><Text style={{ fontSize: 28 }}>👤</Text></View>
              <View style={s.info}>
                <Text style={Typography.bodySemi}>{item.label || item.device_name}</Text>
                <Text style={Typography.caption}>{item.phone || 'No phone set'}</Text>
                {item.last_seen ? <Text style={[Typography.caption, { color: Colors.accent }]}>Last seen: {new Date(item.last_seen).toLocaleString('en-ZA')}</Text> : null}
              </View>
              <View style={s.actions}>
                <TouchableOpacity onPress={() => router.push(`/guardian/${item.id}`)} style={s.actionBtn}>
                  <Ionicons name="location" size={18} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeDevice(item.id, item.label || item.device_name)} style={s.actionBtn}>
                  <Ionicons name="trash-outline" size={18} color={Colors.red} />
                </TouchableOpacity>
              </View>
            </View>
          </PlatinumCard>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 8, flexGrow: 1 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  card: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8, borderRadius: 8, backgroundColor: Colors.shimmerBase },
});
