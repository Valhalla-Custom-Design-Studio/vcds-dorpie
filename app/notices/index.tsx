import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../src/theme';
import { PlatinumCard, Badge, ScreenHeader, EmptyState } from '../../src/components/ui';
import { noticesAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth';

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

  const catColor = (c: string) => c === 'Emergency' ? Colors.red : c === 'Safety' ? Colors.warning : Colors.primary;

  return (
    <View style={s.container}>
      <ScreenHeader title="Notice Board" right={
        <TouchableOpacity onPress={() => router.push('/notices/create')}>
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      } showBack />
      <FlatList
        data={notices}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <FlatList
            horizontal data={CATEGORIES} keyExtractor={i => i}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catBar}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setCat(item)} style={[s.catPill, cat === item && s.catActive]}>
                <Text style={[s.catText, cat === item && { color: '#fff' }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        }
        ListEmptyComponent={!loading ? <EmptyState icon="document-text-outline" title="No notices yet" subtitle="Be the first to post a notice" actionLabel="Post Notice" onAction={() => router.push('/notices/create')} /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/notices/${item.id}`)} style={s.item}>
            <PlatinumCard>
              <View style={s.row}>
                <View style={s.content}>
                  <View style={s.metaRow}>
                    <Badge label={item.category} variant={item.category === 'Emergency' ? 'error' : 'primary'} />
                    <Text style={[Typography.caption, { color: Colors.textMuted }]}>{new Date(item.created_at).toLocaleDateString('en-ZA')}</Text>
                  </View>
                  <Text style={[Typography.bodySemi, { marginTop: 6 }]}>{item.title}</Text>
                  <Text style={[Typography.caption, { marginTop: 4 }]} numberOfLines={2}>{item.body}</Text>
                  <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 6 }]}>By {item.author_name || 'Community'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            </PlatinumCard>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  catBar: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  catActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { color: Colors.textBody, fontSize: 13, fontWeight: '600' },
  item: { marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  content: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
