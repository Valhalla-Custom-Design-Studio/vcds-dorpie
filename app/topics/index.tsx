import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/theme';
import { PlatinumCard, ScreenHeader, EmptyState, Badge, FilterPill } from '@/components/ui';
import { topicsAPI } from '@/services/api';

const CATS = ['All', 'Algemeen', 'Aanbevelings', 'Verlore & Gevind', 'Veiligheid', 'Hulp'];

export default function Topics() {
  const router = useRouter();
  const [topics, setTopics] = useState<any[]>([]);
  const [cat, setCat] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await topicsAPI.list({ category: cat !== 'All' ? cat : undefined });
      setTopics(data.data || []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [cat]);

  return (
    <View style={s.container}>
      <ScreenHeader
        title="Kletshoek"
        right={<TouchableOpacity onPress={() => router.push('/topics/create')}><Ionicons name="add-circle" size={28} color={Colors.primary} /></TouchableOpacity>}
        showBack
      />
      <FlatList
        data={topics}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <FlatList
            horizontal data={CATS} keyExtractor={i => i}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.pillBar}
            renderItem={({ item }) => <FilterPill label={item} active={cat === item} onPress={() => setCat(item)} />}
          />
        }
        ListEmptyComponent={!loading ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="Nog geen besprekings nie"
            subtitle="Begin 'n gesprek met jou gemeenskap"
            actionLabel="Skep Eerste Bespreking"
            onAction={() => router.push('/topics/create')}
          />
        ) : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/topics/${item.id}` as any)} style={s.item}>
            <PlatinumCard>
              <View style={s.row}>
                <View style={s.content}>
                  {item.tag ? <Badge label={item.tag} variant="muted" /> : null}
                  <Text style={[Typography.bodySemi, { marginTop: 4 }]}>{item.title}</Text>
                  <View style={s.meta}>
                    <Text style={[Typography.caption, { color: Colors.textMuted }]}>Deur {item.author_name}</Text>
                    <Text style={[Typography.caption, { color: Colors.textMuted }]}>💬 {item.reply_count || 0}</Text>
                    <Text style={[Typography.caption, { color: Colors.textMuted }]}>👁 {item.view_count || 0}</Text>
                  </View>
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
  meta: { flexDirection: 'row', gap: 12, marginTop: 6 },
});
