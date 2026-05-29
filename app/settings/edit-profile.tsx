import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/theme';
import { ScreenHeader, PlatinumInput, PlatinumButton } from '@/components/ui';
import { profileAPI } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export default function EditProfile() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) { Alert.alert('Fout', 'Naam is verpligtend'); return; }
    setLoading(true);
    try {
      const { data } = await profileAPI.update({ name: name.trim(), phone: phone.trim() });
      setUser(data.data);
      Alert.alert('Sukses', 'Profiel opgedateer!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch { Alert.alert('Fout', 'Kon nie profiel opdateer nie.'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Wysig Profiel" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <PlatinumInput label="Volle Naam" value={name} onChangeText={setName} placeholder="Jan van der Berg" icon="person-outline" />
        <PlatinumInput label="Selfoon" value={phone} onChangeText={setPhone} placeholder="+27 82 000 0000" keyboardType="phone-pad" icon="call-outline" />
        <PlatinumButton label="Stoor Veranderinge" onPress={save} loading={loading} variant="primary" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({ scroll: { padding: Spacing.md, paddingBottom: 48 } });
