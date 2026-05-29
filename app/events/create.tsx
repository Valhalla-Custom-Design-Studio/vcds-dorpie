import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography } from '@/theme';
import { PlatinumButton, PlatinumInput, ScreenHeader } from '@/components/ui';
import { eventsAPI } from '@/services/api';

export default function CreateEvent() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!title || !startsAt) { setError('Title and start date/time are required'); return; }
    setLoading(true); setError('');
    try {
      await eventsAPI.create({ title, description, location, starts_at: new Date(startsAt).toISOString() });
      router.back();
    } catch (e: any) { setError(e.response?.data?.message || 'Failed to create event'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Create Event" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        {error ? <View style={s.errBox}><Text style={s.errText}>{error}</Text></View> : null}
        <PlatinumInput label="Event Title *" value={title} onChangeText={setTitle} placeholder="e.g. Community Braai" autoCapitalize="words" />
        <PlatinumInput label="Start Date & Time *" value={startsAt} onChangeText={setStartsAt} placeholder="YYYY-MM-DD HH:MM" icon="calendar-outline" />
        <PlatinumInput label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Town Hall" icon="location-outline" />
        <PlatinumInput label="Description" value={description} onChangeText={setDescription} placeholder="Describe the event..." multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top' }} />
        <PlatinumButton label="Create Event" onPress={submit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  errBox: { backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.red },
  errText: { color: Colors.red },
});
