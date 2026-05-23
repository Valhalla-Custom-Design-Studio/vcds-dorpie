import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme';
import { PlatinumButton, PlatinumInput, ScreenHeader } from '../../src/components/ui';
import { topicsAPI } from '../../src/services/api';

export default function CreateTopic() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!title || !body) { setError('Title and body required'); return; }
    setLoading(true); setError('');
    try { await topicsAPI.create({ title, body, tag }); router.back(); }
    catch (e: any) { setError(e.response?.data?.message || 'Failed to create topic'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="New Discussion" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        {error ? <View style={s.errBox}><Text style={s.errText}>{error}</Text></View> : null}
        <PlatinumInput label="Title *" value={title} onChangeText={setTitle} placeholder="What do you want to discuss?" />
        <PlatinumInput label="Tag (optional)" value={tag} onChangeText={setTag} placeholder="e.g. Question, Announcement" />
        <PlatinumInput label="Body *" value={body} onChangeText={setBody} placeholder="Share your thoughts..." multiline numberOfLines={6} style={{ height: 140, textAlignVertical: 'top' }} />
        <PlatinumButton label="Start Discussion" onPress={submit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  errBox: { backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.red },
  errText: { color: Colors.red },
});
