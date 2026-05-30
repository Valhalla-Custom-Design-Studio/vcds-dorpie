import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { PrimaryButton, InputField } from '@/components/ui';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore(s => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Vul asseblief alle velde in.'); return; }
    setLoading(true); setError('');
    try {
      const res = await authAPI.login(email.trim().toLowerCase(), password);
      const { user, access_token } = res.data.data;
      setAuth(user, access_token);
      router.replace('/(tabs)/index');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Aanmelding het misluk. Probeer weer.');
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
          <Text style={s.title}>Welkom Terug</Text>
          <Text style={s.subtitle}>Teken in by jou Dorpwag™ rekening</Text>
        </View>

        {error ? <View style={s.errorBanner}><Text style={s.errorText}>{error}</Text></View> : null}

        <InputField label="E-posadres" value={email} onChangeText={setEmail} placeholder="jou@epos.co.za" keyboardType="email-address" icon="mail-outline" />
        <InputField label="Wagwoord" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry icon="lock-closed-outline" />

        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={s.forgotLink}>
          <Text style={s.forgotText}>Wagwoord vergeet?</Text>
        </TouchableOpacity>

        <PrimaryButton title="Teken In" onPress={handleLogin} loading={loading} variant="accent" style={{ marginTop: Spacing.md }} />

        <View style={s.signupRow}>
          <Text style={s.signupText}>Nog nie 'n rekening nie? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={s.signupLink}>Registreer</Text>
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
  forgotLink: { alignSelf: 'flex-end', marginBottom: Spacing.sm },
  forgotText: { color: Colors.accent, fontSize: 14 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  signupText: { color: Colors.textMuted, fontSize: 14 },
  signupLink: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
});
