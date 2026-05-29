import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { PrimaryButton, InputField } from '@/components/ui';
import { authAPI, townsAPI } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export default function Signup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore(s => s.setAuth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [townId, setTownId] = useState('');
  const [towns, setTowns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    townsAPI.list().then(r => setTowns(r.data.data || [])).catch(() => {});
  }, []);

  const handleSignup = async () => {
    if (!name || !email || !password) { setError('Naam, e-pos en wagwoord is verpligtend.'); return; }
    if (password.length < 8) { setError('Wagwoord moet minstens 8 karakters wees.'); return; }
    setLoading(true); setError('');
    try {
      const res = await authAPI.signup({ name, email: email.trim().toLowerCase(), password, townId: townId || undefined, phone: phone || undefined });
      const { user, access_token } = res.data.data;
      setAuth(user, access_token);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Registrasie het misluk. Probeer weer.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[s.container, { paddingTop: insets.top }]} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.textBody} />
        </TouchableOpacity>

        <View style={s.header}>
          <Ionicons name="shield-checkmark" size={40} color={Colors.accent} />
          <Text style={s.title}>Skep Rekening</Text>
          <Text style={s.subtitle}>Sluit aan by jou plaaslike Dorpwag™ gemeenskap</Text>
        </View>

        {error ? <View style={s.errorBanner}><Text style={s.errorText}>{error}</Text></View> : null}

        <InputField label="Volle Naam" value={name} onChangeText={setName} placeholder="Jan van der Berg" icon="person-outline" />
        <InputField label="E-posadres" value={email} onChangeText={setEmail} placeholder="jou@epos.co.za" keyboardType="email-address" icon="mail-outline" />
        <InputField label="Selfoon (opsioneel)" value={phone} onChangeText={setPhone} placeholder="+27 82 000 0000" keyboardType="phone-pad" icon="call-outline" />
        <InputField label="Wagwoord" value={password} onChangeText={setPassword} placeholder="Min. 8 karakters" secureTextEntry icon="lock-closed-outline" />

        <Text style={s.pickerLabel}>DORP</Text>
        <View style={s.pickerContainer}>
          <Picker selectedValue={townId} onValueChange={setTownId} style={s.picker} dropdownIconColor={Colors.textMuted}>
            <Picker.Item label="Kies jou dorp..." value="" color={Colors.textMuted} />
            {towns.map(t => <Picker.Item key={t.id} label={`${t.name}, ${t.province}`} value={t.id} color={Colors.textHeading} />)}
          </Picker>
        </View>

        <PrimaryButton title="Registreer Gratis" onPress={handleSignup} loading={loading} variant="accent" style={{ marginTop: Spacing.md }} />

        <View style={s.loginRow}>
          <Text style={s.loginText}>Het jy al 'n rekening? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={s.loginLink}>Teken In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  back: { marginBottom: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  title: { ...Typography.h2, marginTop: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
  errorBanner: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 8, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.error },
  errorText: { color: Colors.error, fontSize: 14 },
  pickerLabel: { ...Typography.label, marginBottom: 6 },
  pickerContainer: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: Spacing.md, overflow: 'hidden' },
  picker: { color: Colors.textHeading, height: 50 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  loginText: { color: Colors.textMuted, fontSize: 14 },
  loginLink: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
});
