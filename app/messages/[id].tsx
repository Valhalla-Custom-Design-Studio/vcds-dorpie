import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/theme';
import { ScreenHeader } from '@/components/ui';
import { messagesAPI } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export default function ThreadDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore(s => s.user);
  const [thread, setThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const load = async () => {
    try {
      const { data } = await messagesAPI.thread(id!);
      setThread(data.data?.thread);
      setMessages(data.data?.messages || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const send = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await messagesAPI.reply(id!, reply.trim());
      setReply('');
      await load();
      setTimeout(() => listRef.current?.scrollToEnd(), 100);
    } finally { setSending(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <ScreenHeader title={thread?.other_name || 'Chat'} showBack />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({ item }) => {
          const isMe = item.sender_id === user?.id;
          return (
            <View style={[s.msgWrap, isMe ? s.msgRight : s.msgLeft]}>
              <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
                <Text style={[s.msgText, isMe ? { color: '#fff' } : { color: Colors.textHeading }]}>{item.body}</Text>
              </View>
              <Text style={s.msgTime}>{new Date(item.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
      />
      <View style={s.inputBar}>
        <TextInput
          style={s.input} placeholder="Type a message..." placeholderTextColor={Colors.textMuted}
          value={reply} onChangeText={setReply} multiline maxLength={500}
        />
        <TouchableOpacity onPress={send} disabled={sending} style={s.sendBtn}>
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  msgWrap: { marginBottom: 8 },
  msgRight: { alignItems: 'flex-end' },
  msgLeft: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 21 },
  msgTime: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder, backgroundColor: Colors.bg },
  input: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, color: Colors.textHeading, maxHeight: 100, fontSize: 15 },
  sendBtn: { backgroundColor: Colors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
