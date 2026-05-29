import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '@/theme';
import { PlatinumButton, PlatinumInput, ScreenHeader } from '@/components/ui';
import { listingsAPI } from '@/services/api';

const TYPES = ['For Sale', 'Wanted', 'Free', 'Rent', 'Services'];

export default function CreateListing() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', listing_type: 'For Sale', price: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.description) { setError('Title and description required'); return; }
    setLoading(true); setError('');
    try {
      await listingsAPI.create({ ...form, price: form.price ? parseFloat(form.price) : null });
      router.back();
    } catch (e: any) { setError(e.response?.data?.message || 'Failed to create listing'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Post Listing" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        {error ? <View style={s.errBox}><Text style={s.errText}>{error}</Text></View> : null}
        <PlatinumInput label="Title *" value={form.title} onChangeText={v => set('title', v)} placeholder="What are you listing?" />
        <View style={s.pickerWrap}>
          <Text style={s.pickerLabel}>Type</Text>
          <View style={s.pickerBox}>
            <Picker selectedValue={form.listing_type} onValueChange={v => set('listing_type', v)} style={{ color: Colors.textHeading }} dropdownIconColor={Colors.textMuted}>
              {TYPES.map(t => <Picker.Item key={t} label={t} value={t} />)}
            </Picker>
          </View>
        </View>
        <PlatinumInput label="Description *" value={form.description} onChangeText={v => set('description', v)} placeholder="Describe your listing..." multiline numberOfLines={4} style={{ height: 100, textAlignVertical: 'top' }} />
        {form.listing_type !== 'Free' && form.listing_type !== 'Wanted' && (
          <PlatinumInput label="Price (R)" value={form.price} onChangeText={v => set('price', v)} placeholder="0.00" keyboardType="decimal-pad" icon="pricetag-outline" />
        )}
        <PlatinumButton label="Post Listing" onPress={submit} loading={loading} />
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
