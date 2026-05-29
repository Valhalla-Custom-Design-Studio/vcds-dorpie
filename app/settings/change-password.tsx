import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../../src/theme';
import { ScreenHeader, PlatinumInput, PlatinumButton } from '../../src/components/ui';
import { authAPI } from '../../src/services/api';

export default function ChangePassword() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!current || !newPass || !confirm) { Alert.alert('Fout', 'Vul alle velde in'); return; }
    if (newPass !== confirm) { Alert.alert('Fout', 'Nuwe wagwoorde stem nie ooreen nie'); return; }
    if (newPass.length < 8) { Alert.alert('Fout', 'Wagwoord moet minstens 8 karakters wees'); return; }
    setLoading(true);
    try {
      await authAPI.changePassword(current, newPass);
      Alert.alert('Sukses', 'Wagwoord suksesvol verander!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Fout', e.response?.data?.message || 'Kon nie wagwoord verander nie.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Verander Wagwoord" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <PlatinumInput label="Huidige Wagwoord" value={current} onChangeText={setCurrent} secureTextEntry icon="lock-closed-outline" />
        <PlatinumInput label="Nuwe Wagwoord" value={newPass} onChangeText={setNewPass} secureTextEntry icon="lock-open-outline" />
        <PlatinumInput label="Bevestig Nuwe Wagwoord" value={confirm} onChangeText={setConfirm} secureTextEntry icon="checkmark-circle-outline" />
        <PlatinumButton label="Verander Wagwoord" onPress={save} loading={loading} variant="primary" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({ scroll: { padding: Spacing.md, paddingBottom: 48 } });
