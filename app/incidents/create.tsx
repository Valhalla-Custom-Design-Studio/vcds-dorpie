import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '@/theme';
import { PlatinumButton, PlatinumInput, ScreenHeader } from '@/components/ui';
import { reportsAPI } from '@/services/api';

const CATS = ['Theft', 'Break-in', 'Vandalism', 'Suspicious Activity', 'Assault', 'Other'];
const SEVERITIES = ['low', 'medium', 'high'];

export default function CreateIncident() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', category: 'Other', severity: 'medium', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.description) { setError('Title and description required'); return; }
    setLoading(true); setError('');
    try { await reportsAPI.create(form); router.back(); }
    catch (e: any) { setError(e.response?.data?.message || 'Failed to submit report'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Report Incident" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        {error ? <View style={s.errBox}><Text style={s.errText}>{error}</Text></View> : null}
        <PlatinumInput label="Title *" value={form.title} onChangeText={v => set('title', v)} placeholder="Brief incident description" />
        <View style={s.pickerWrap}>
          <Text style={s.pickerLabel}>Category</Text>
          <View style={s.pickerBox}>
            <Picker selectedValue={form.category} onValueChange={v => set('category', v)} style={{ color: Colors.textHeading }} dropdownIconColor={Colors.textMuted}>
              {CATS.map(c => <Picker.Item key={c} label={c} value={c} />)}
            </Picker>
          </View>
        </View>
        <View style={s.pickerWrap}>
          <Text style={s.pickerLabel}>Severity</Text>
          <View style={s.pickerBox}>
            <Picker selectedValue={form.severity} onValueChange={v => set('severity', v)} style={{ color: Colors.textHeading }} dropdownIconColor={Colors.textMuted}>
              {SEVERITIES.map(s => <Picker.Item key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} value={s} />)}
            </Picker>
          </View>
        </View>
        <PlatinumInput label="Location / Address" value={form.address} onChangeText={v => set('address', v)} placeholder="Where did this happen?" icon="location-outline" />
        <PlatinumInput label="Description *" value={form.description} onChangeText={v => set('description', v)} placeholder="Describe what happened in detail..." multiline numberOfLines={6} style={{ height: 140, textAlignVertical: 'top' }} />
        <PlatinumButton label="Submit Report" onPress={submit} loading={loading} variant="danger" />
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
