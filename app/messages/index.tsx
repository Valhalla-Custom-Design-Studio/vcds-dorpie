import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../src/theme';
import { PlatinumCard, ScreenHeader, EmptyState } from '../../src/components/ui';
import { messagesAPI } from '../../src/services/api';

export default function Messages() {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await messagesAPI.threads(); setThreads(data.data || []); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={s.container}>
      <ScreenHeader title="Messages" showBack />
      <FlatList
        data={threads}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListEmptyComponent={!loading ? <EmptyState icon="chatbubble-ellipses-outline" title="No messages yet" subtitle="Start a conversation with a community member" /> : null}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/messages/${item.id}`)}>
            <PlatinumCard style={s.card}>
              <View style={s.row}>
                <View style={s.avatar}><Text style={{ fontSize: 22 }}>{item.other_name?.[0]?.toUpperCase() || '?'}</Text></View>
                <View style={s.content}>
                  <Text style={Typography.bodySemi}>{item.other_name}</Text>
                  <Text style={[Typography.caption, { marginTop: 2 }]} numberOfLines={1}>{item.last_message || 'No messages yet'}</Text>
                </View>
                {item.unread_count > 0 && (
                  <View style={s.unreadBadge}><Text style={s.unreadText}>{item.unread_count}</Text></View>
                )}
                <Text style={[Typography.caption, { color: Colors.textMuted, marginLeft: 4 }]}>
                  {item.last_message_at ? new Date(item.last_message_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
            </PlatinumCard>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 4, flexGrow: 1 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  card: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '30', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  unreadBadge: { backgroundColor: Colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
