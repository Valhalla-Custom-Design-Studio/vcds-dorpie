import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme';
import { PlatinumButton, PlatinumInput, ScreenHeader } from '../../src/components/ui';
import { guardianAPI } from '../../src/services/api';

export default function AddDevice() {
  const router = useRouter();
  const [form, setForm] = useState({ label: '', phone: '', device_token: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.label) { setError('Label is required'); return; }
    setLoading(true); setError('');
    try { await guardianAPI.addDevice(form); router.back(); }
    catch (e: any) { setError(e.response?.data?.message || 'Failed to add device'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Add Guardian Device" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        {error ? <View style={s.errBox}><Text style={s.errText}>{error}</Text></View> : null}
        <PlatinumInput label="Label / Name *" value={form.label} onChangeText={v => set('label', v)} placeholder="e.g. Mom, Child 1" icon="person-outline" />
        <PlatinumInput label="Phone Number" value={form.phone} onChangeText={v => set('phone', v)} placeholder="e.g. 0821234567" keyboardType="phone-pad" icon="call-outline" />
        <PlatinumInput label="Device Token (optional)" value={form.device_token} onChangeText={v => set('device_token', v)} placeholder="Paste device token here" icon="key-outline" />
        <PlatinumButton label="Add Device" onPress={submit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  errBox: { backgroundColor: 'rgba(220,38,38,0.1)', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.red },
  errText: { color: Colors.red },
});
