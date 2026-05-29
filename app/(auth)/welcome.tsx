import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { PrimaryButton } from '@/components/ui';

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.lg }]}>
      {/* Logo */}
      <View style={s.logoSection}>
        <View style={s.logoCircle}>
          <Ionicons name="shield-checkmark" size={56} color={Colors.accent} />
        </View>
        <Text style={s.appName}>Dorpwag™</Text>
        <Text style={s.tagline}>Jou dorp. Jou veiligheid. Jou gemeenskap.</Text>
      </View>

      {/* Features */}
      <View style={s.features}>
        {[
          { icon: 'warning', label: 'SOS Noodalarm', desc: 'Een druk. Onmiddellike hulp.' },
          { icon: 'shield', label: 'Guardian Mode™', desc: 'Realtime veiligheidsopsporing.' },
          { icon: 'people', label: 'Gemeenskap', desc: 'Bly verbind met jou dorp.' },
          { icon: 'storefront', label: 'Plaaslike Gids', desc: 'Besighede & markplek.' },
        ].map((f, i) => (
          <View key={i} style={s.featureRow}>
            <View style={s.featureIcon}>
              <Ionicons name={f.icon as any} size={22} color={Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.featureLabel}>{f.label}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <PrimaryButton title="Registreer Gratis" onPress={() => router.push('/(auth)/signup')} variant="accent" style={{ marginBottom: Spacing.sm }} />
        <PrimaryButton title="Teken In" onPress={() => router.push('/(auth)/login')} variant="outline" />
      </View>

      <Text style={s.legal}>Deur voort te gaan stem jy in tot ons Privaatheidsbeleid & Gebruiksvoorwaardes.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Spacing.lg, justifyContent: 'space-between' },
  logoSection: { alignItems: 'center', paddingTop: Spacing.xxl },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    ...Shadow.glowAccent,
  },
  appName: { ...Typography.h1, color: Colors.textHeading, letterSpacing: 1 },
  tagline: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs },
  features: { gap: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { ...Typography.h4, fontSize: 15 },
  featureDesc: { ...Typography.bodySmall, color: Colors.textMuted },
  actions: {},
  legal: { ...Typography.caption, textAlign: 'center', color: Colors.textMuted },
});
