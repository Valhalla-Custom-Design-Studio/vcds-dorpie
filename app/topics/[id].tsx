import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../src/theme';
import { PlatinumCard, ScreenHeader } from '../../src/components/ui';
import { topicsAPI } from '../../src/services/api';

export default function TopicDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [topic, setTopic] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = async () => {
    try {
      const { data } = await topicsAPI.get(id!);
      setTopic(data.data?.topic);
      setReplies(data.data?.replies || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const postReply = async () => {
    if (!reply.trim()) return;
    setPosting(true);
    try { await topicsAPI.reply(id!, reply.trim()); setReply(''); await load(); }
    finally { setPosting(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  return (
    <View style={s.container}>
      <ScreenHeader title="Discussion" showBack />
      <FlatList
        data={replies}
        keyExtractor={r => r.id}
        ListHeaderComponent={topic ? (
          <PlatinumCard style={s.header}>
            <Text style={Typography.h2}>{topic.title}</Text>
            <Text style={[Typography.body, { lineHeight: 24, marginTop: 8 }]}>{topic.body}</Text>
            <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 8 }]}>By {topic.author_name} · {new Date(topic.created_at).toLocaleDateString('en-ZA')}</Text>
          </PlatinumCard>
        ) : null}
        renderItem={({ item, index }) => (
          <PlatinumCard style={s.reply}>
            <View style={s.replyHeader}>
              <View style={s.replyAvatar}><Text style={{ fontSize: 16 }}>{item.author_name?.[0]?.toUpperCase() || '?'}</Text></View>
              <View>
                <Text style={Typography.bodySemi}>{item.author_name}</Text>
                <Text style={[Typography.caption, { color: Colors.textMuted }]}>{new Date(item.created_at).toLocaleDateString('en-ZA')}</Text>
              </View>
            </View>
            <Text style={[Typography.body, { lineHeight: 22, marginTop: 8 }]}>{item.body}</Text>
            <View style={s.voteRow}>
              <TouchableOpacity onPress={() => topicsAPI.vote(id!, item.id, 1)} style={s.voteBtn}>
                <Ionicons name="thumbs-up-outline" size={14} color={Colors.textMuted} />
                <Text style={[Typography.caption, { color: Colors.textMuted }]}>{item.upvotes || 0}</Text>
              </TouchableOpacity>
            </View>
          </PlatinumCard>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 80, gap: 8, flexGrow: 1 }}
      />
      <View style={s.inputBar}>
        <TextInput style={s.input} placeholder="Write a reply..." placeholderTextColor={Colors.textMuted} value={reply} onChangeText={setReply} multiline />
        <TouchableOpacity onPress={postReply} disabled={posting} style={s.sendBtn}>
          {posting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  header: { marginBottom: 8 },
  reply: {},
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  replyAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '30', alignItems: 'center', justifyContent: 'center' },
  voteRow: { flexDirection: 'row', marginTop: 8 },
  voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, backgroundColor: Colors.bg },
  input: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: Colors.textHeading, maxHeight: 80 },
  sendBtn: { backgroundColor: Colors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
