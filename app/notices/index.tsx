import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/theme';
import { PlatinumCard, Badge, ScreenHeader, EmptyState, FilterPill } from '@/components/ui';
import { noticesAPI } from '@/services/api';
import { useAuthStore } from '@/store/auth';

const CATEGORIES = ['All', 'General', 'Safety', 'Events', 'Lost & Found', 'Utility', 'Emergency'];

export default function Notices() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const [notices, setNotices] = useState<any[]>([]);
  const [cat, setCat] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await noticesAPI.list({ category: cat !== 'All' ? cat : undefined });
      setNotices(data.data || []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [cat]);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Kennisgewings"
        subtitle={user?.town_name}
        right={
          <TouchableOpacity onPress={() => router.push('/notices/create')}>
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </TouchableOpacity>
        }
        showBack
      />
      <FlatList
        data={notices}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <FlatList
            horizontal data={CATEGORIES} keyExtractor={i => i}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.pillBar}
            renderItem={({ item }) => (
              <FilterPill label={item} active={cat === item} onPress={() => setCat(item)} />
            )}
          />
        }
        ListEmptyComponent={!loading ? (
          <EmptyState
            icon="megaphone-outline"
            title="Nog geen kennisgewings nie"
            subtitle="Kyk later vir gemeenskapsopdaterings"
            actionLabel="Plaas Kennisgewings"
            onAction={() => router.push('/notices/create')}
          />
        ) : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/notices/${item.id}` as any)} style={s.item}>
            <PlatinumCard accentColor={item.category === 'Emergency' ? Colors.accentRed : item.category === 'Safety' ? Colors.accentYellow : undefined}>
              <View style={s.row}>
                <View style={s.content}>
                  <View style={s.metaRow}>
                    <Badge label={item.category} variant={item.category === 'Emergency' ? 'error' : item.category === 'Safety' ? 'warning' : 'primary'} />
                    <Text style={[Typography.caption, { color: Colors.textMuted, marginLeft: 8 }]}>
                      {new Date(item.created_at).toLocaleDateString('af-ZA')}
                    </Text>
                  </View>
                  <Text style={[Typography.bodySemi, { marginTop: 6 }]} numberOfLines={2}>{item.title}</Text>
                  {item.body ? <Text style={[Typography.bodySmall, { color: Colors.textMuted, marginTop: 4 }]} numberOfLines={2}>{item.body}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            </PlatinumCard>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  pillBar: { paddingHorizontal: 16, paddingVertical: 12 },
  item: { marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  content: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
});
