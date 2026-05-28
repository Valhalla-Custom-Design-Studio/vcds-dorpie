import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../src/theme';
import { ScreenHeader, PlatinumCard } from '../../src/components/ui';

const FAQ = [
  { q: "Hoe aktiveer ek 'n SOS noodalarm?", a: 'Gaan na die Veiligheid-oortjie en tik "Aktiveer SOS". Jou guardian kontakte sal onmiddellik in kennis gestel word.' },
  { q: 'Hoe werk Guardian Mode™?', a: 'Guardian Mode™ stuur jou ligging elke 5 minute na jou vertroude kontakte. Gaan na Veiligheid > Guardian om dit te aktiveer.' },
  { q: 'Wat is die Dooie Man Incheck?', a: "Stel 'n tydhouer in. As jy nie voor die tyd incheckin nie, word jou kontakte outomaties verwittig." },
  { q: 'Hoe kanselleer ek my intekening?', a: 'Gaan na Profiel > Intekening > Betalingsgeskiedenis om jou intekening te bestuur.' },
];

export default function Help() {
  return (
    <View style={s.container}>
      <ScreenHeader title="Hulp & Ondersteuning" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[Typography.h3, { marginBottom: Spacing.md }]}>Algemene Vrae</Text>
        {FAQ.map((item, i) => (
          <PlatinumCard key={i} style={s.faq}>
            <Text style={[Typography.h4, { marginBottom: 6 }]}>{item.q}</Text>
            <Text style={Typography.body}>{item.a}</Text>
          </PlatinumCard>
        ))}
        <Text style={[Typography.h3, { marginTop: Spacing.xl, marginBottom: Spacing.md }]}>Kontak Ons</Text>
        <PlatinumCard style={s.contactCard}>
          {[
            { icon: 'mail-outline', label: 'support@vcds.co.za', onPress: () => Linking.openURL('mailto:support@vcds.co.za') },
            { icon: 'globe-outline', label: 'www.vcds.co.za', onPress: () => Linking.openURL('https://vcds.co.za') },
          ].map((item, i) => (
            <TouchableOpacity key={item.label} style={[s.contactRow, i === 0 && s.contactBorder]} onPress={item.onPress}>
              <Ionicons name={item.icon as any} size={22} color={Colors.primary} />
              <Text style={[Typography.body, { color: Colors.accent }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </PlatinumCard>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, paddingBottom: 48 },
  faq: { marginBottom: 10 },
  contactCard: { padding: 0, overflow: 'hidden' },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12 },
  contactBorder: { borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
});
