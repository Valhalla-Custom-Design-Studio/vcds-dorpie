import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../../src/theme';
import { PlatinumButton, PlatinumInput, ScreenHeader } from '../../src/components/ui';
import { businessesAPI } from '../../src/services/api';

const CATS = ['Food', 'Services', 'Health', 'Retail', 'Auto', 'Legal', 'Other'];

export default function CreateBusiness() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', description: '', category: 'Other', phone: '', email: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.description) { setError('Name and description required'); return; }
    setLoading(true); setError('');
    try { await businessesAPI.create(form); router.back(); }
    catch (e: any) { setError(e.response?.data?.message || 'Failed to add business'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Add Business" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        {error ? <View style={s.errBox}><Text style={s.errText}>{error}</Text></View> : null}
        <PlatinumInput label="Business Name *" value={form.name} onChangeText={v => set('name', v)} placeholder="Your business name" />
        <View style={s.pickerWrap}>
          <Text style={s.pickerLabel}>Category</Text>
          <View style={s.pickerBox}>
            <Picker selectedValue={form.category} onValueChange={v => set('category', v)} style={{ color: Colors.textHeading }} dropdownIconColor={Colors.textMuted}>
              {CATS.map(c => <Picker.Item key={c} label={c} value={c} />)}
            </Picker>
          </View>
        </View>
        <PlatinumInput label="Description *" value={form.description} onChangeText={v => set('description', v)} placeholder="Describe your business" multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
        <PlatinumInput label="Phone" value={form.phone} onChangeText={v => set('phone', v)} placeholder="e.g. 0821234567" keyboardType="phone-pad" icon="call-outline" />
        <PlatinumInput label="Email" value={form.email} onChangeText={v => set('email', v)} placeholder="business@example.com" keyboardType="email-address" icon="mail-outline" />
        <PlatinumInput label="Address" value={form.address} onChangeText={v => set('address', v)} placeholder="Street address" icon="location-outline" />
        <PlatinumButton label="Add Business" onPress={submit} loading={loading} />
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
