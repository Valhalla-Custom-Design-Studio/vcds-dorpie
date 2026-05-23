import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Colors, Typography } from '../../src/theme';
import { PlatinumButton, PlatinumInput, ScreenHeader } from '../../src/components/ui';
import { noticesAPI } from '../../src/services/api';

const CATEGORIES = ['General', 'Safety', 'Events', 'Lost & Found', 'Utility', 'Emergency'];

export default function CreateNotice() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!title.trim() || !body.trim()) { setError('Title and body are required'); return; }
    setLoading(true); setError('');
    try {
      await noticesAPI.create({ title: title.trim(), body: body.trim(), category });
      router.back();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to post notice');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Post a Notice" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        {error ? <View style={s.errBox}><Text style={s.errText}>{error}</Text></View> : null}
        <PlatinumInput label="Title *" value={title} onChangeText={setTitle} placeholder="Notice title" />
        <View style={s.pickerWrap}>
          <Text style={s.pickerLabel}>Category</Text>
          <View style={s.pickerBox}>
            <Picker selectedValue={category} onValueChange={setCategory} style={{ color: Colors.textHeading }} dropdownIconColor={Colors.textMuted}>
              {CATEGORIES.map(c => <Picker.Item key={c} label={c} value={c} />)}
            </Picker>
          </View>
        </View>
        <PlatinumInput
          label="Body *" value={body} onChangeText={setBody}
          placeholder="Write your notice here..." multiline numberOfLines={6}
          style={{ height: 120, textAlignVertical: 'top' }}
        />
        <PlatinumButton label="Post Notice" onPress={submit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  errBox: { backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.red },
  errText: { color: Colors.red },
  pickerWrap: { marginBottom: 16 },
  pickerLabel: { fontSize: 13, color: Colors.textMuted, marginBottom: 6, fontWeight: '500' },
  pickerBox: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder, borderRadius: 12, overflow: 'hidden' },
});
