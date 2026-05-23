import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/theme';
import { PrimaryButton, InputField } from '../../src/components/ui';
import { authAPI } from '../../src/services/api';

export default function ForgotPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email) { setError('E-posadres is verpligtend.'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch { setError('Kon nie versoek stuur nie. Probeer weer.'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.container, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.textBody} />
        </TouchableOpacity>
        <View style={s.content}>
          <Ionicons name="lock-open-outline" size={48} color={Colors.accent} style={{ marginBottom: Spacing.md }} />
          <Text style={s.title}>Wagwoord Vergeet?</Text>
          <Text style={s.subtitle}>Voer jou e-posadres in en ons stuur jou 'n herstelkoppeling.</Text>
          {sent ? (
            <View style={s.successBanner}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={s.successText}>As die e-posadres bestaan, is 'n herstelkoppeling gestuur.</Text>
            </View>
          ) : (
            <>
              {error ? <View style={s.errorBanner}><Text style={s.errorText}>{error}</Text></View> : null}
              <InputField label="E-posadres" value={email} onChangeText={setEmail} placeholder="jou@epos.co.za" keyboardType="email-address" icon="mail-outline" />
              <PrimaryButton title="Stuur Herstelkoppeling" onPress={handleSubmit} loading={loading} variant="accent" />
            </>
          )}
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={{ marginTop: Spacing.lg, alignItems: 'center' }}>
            <Text style={{ color: Colors.accent, fontSize: 14 }}>Terug na Aanmelding</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg },
  back: { marginBottom: Spacing.lg },
  content: { flex: 1, alignItems: 'center', paddingTop: Spacing.xxl },
  title: { ...Typography.h2, marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.xl },
  errorBanner: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 8, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.error, width: '100%' },
  errorText: { color: Colors.error, fontSize: 14 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 8, padding: Spacing.md, borderWidth: 1, borderColor: Colors.success },
  successText: { color: Colors.success, fontSize: 14, flex: 1 },
});
