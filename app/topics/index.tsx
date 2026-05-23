import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../src/theme';
import { PlatinumCard, ScreenHeader, EmptyState, Badge } from '../../src/components/ui';
import { topicsAPI } from '../../src/services/api';

export default function Topics() {
  const router = useRouter();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await topicsAPI.list(); setTopics(data.data || []); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={s.container}>
      <ScreenHeader title="Community Forum" showBack right={
        <TouchableOpacity onPress={() => router.push('/topics/create')}><Ionicons name="add-circle" size={28} color={Colors.primary} /></TouchableOpacity>
      } />
      <FlatList
        data={topics}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? <EmptyState icon="chatbubbles-outline" title="No topics yet" actionLabel="Start a Discussion" onAction={() => router.push('/topics/create')} /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/topics/${item.id}`)} style={s.item}>
            <PlatinumCard>
              <View style={s.row}>
                <View style={s.content}>
                  {item.tag ? <Badge label={item.tag} variant="muted" /> : null}
                  <Text style={[Typography.bodySemi, { marginTop: 4 }]}>{item.title}</Text>
                  <View style={s.meta}>
                    <Text style={[Typography.caption, { color: Colors.textMuted }]}>By {item.author_name}</Text>
                    <Text style={[Typography.caption, { color: Colors.textMuted }]}>💬 {item.reply_count || 0}</Text>
                    <Text style={[Typography.caption, { color: Colors.textMuted }]}>👁 {item.view_count || 0}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            </PlatinumCard>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  item: { marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  content: { flex: 1 },
  meta: { flexDirection: 'row', gap: 12, marginTop: 6 },
});
