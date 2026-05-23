import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../src/theme';
import { PlatinumCard, Badge, ScreenHeader } from '../../src/components/ui';
import { noticesAPI } from '../../src/services/api';

const REACTIONS = ['👍', '❤️', '😮', '😢', '😡'];

export default function NoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [notice, setNotice] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const load = async () => {
    try {
      const [n, c] = await Promise.all([noticesAPI.get(id!), noticesAPI.comments(id!)]);
      setNotice(n.data.data);
      setComments(c.data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const postComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await noticesAPI.comment(id!, comment.trim());
      setComment('');
      await load();
    } finally { setPosting(false); }
  };

  const react = async (emoji: string) => {
    try { await noticesAPI.react(id!, emoji); await load(); } catch {}
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (!notice) return <View style={s.center}><Text style={Typography.body}>Notice not found</Text></View>;

  return (
    <View style={s.container}>
      <ScreenHeader title="Notice" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <PlatinumCard>
          <View style={s.metaRow}>
            <Badge label={notice.category} variant={notice.category === 'Emergency' ? 'error' : 'primary'} />
            <Text style={[Typography.caption, { color: Colors.textMuted }]}>{new Date(notice.created_at).toLocaleDateString('en-ZA')}</Text>
          </View>
          <Text style={[Typography.h2, { marginTop: 10, marginBottom: 12 }]}>{notice.title}</Text>
          <Text style={[Typography.body, { lineHeight: 24 }]}>{notice.body}</Text>
          <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 12 }]}>Posted by {notice.author_name || 'Community Member'} · {notice.town_name}</Text>
        </PlatinumCard>

        {/* Reactions */}
        <View style={s.reactRow}>
          {REACTIONS.map(r => (
            <TouchableOpacity key={r} onPress={() => react(r)} style={s.reactBtn}>
              <Text style={{ fontSize: 24 }}>{r}</Text>
              <Text style={[Typography.caption, { color: Colors.textMuted }]}>{notice.reactions?.[r] || 0}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Comments */}
        <Text style={[Typography.h3, { marginBottom: 12 }]}>Comments ({comments.length})</Text>
        {comments.map((c: any) => (
          <PlatinumCard key={c.id} style={s.commentCard}>
            <Text style={Typography.bodySemi}>{c.author_name}</Text>
            <Text style={[Typography.body, { marginTop: 4 }]}>{c.body}</Text>
            <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 4 }]}>{new Date(c.created_at).toLocaleDateString('en-ZA')}</Text>
          </PlatinumCard>
        ))}

        {/* Comment Input */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            placeholder="Add a comment..."
            placeholderTextColor={Colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <TouchableOpacity onPress={postComment} disabled={posting} style={s.sendBtn}>
            {posting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  scroll: { padding: 16, paddingBottom: 32 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reactRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 16, backgroundColor: Colors.surface, borderRadius: 12, padding: 12 },
  reactBtn: { alignItems: 'center' },
  commentCard: { marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8 },
  input: {
    flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: Colors.textHeading, maxHeight: 100,
  },
  sendBtn: { backgroundColor: Colors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
