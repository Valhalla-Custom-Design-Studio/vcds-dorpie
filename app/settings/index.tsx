import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '@/theme';
import { PlatinumCard, ScreenHeader, SectionHeader } from '@/components/ui';

const SETTINGS = [
  { section: 'Veiligheid & Gesondheid', items: [
    { icon: 'location-outline', label: 'Geo-Omheinings', route: '/geofence' },
    { icon: 'happy-outline', label: 'Gesigstemming Skandering', route: '/mood' },
    { icon: 'people-outline', label: 'SOS Noodkontakte', route: '/sos-contacts' },
  ]},
  { section: 'Rekening', items: [
    { icon: 'person-outline', label: 'Wysig Profiel', route: '/settings/edit-profile' },
    { icon: 'lock-closed-outline', label: 'Verander Wagwoord', route: '/settings/change-password' },
    { icon: 'notifications-outline', label: 'Kennisgewings', route: '/settings/notifications' },
    { icon: 'language-outline', label: 'Taal', route: '/settings/language' },
  ]},
  { section: 'Betaling', items: [
    { icon: 'star-outline', label: 'Intekening', route: '/subscribe' },
    { icon: 'receipt-outline', label: 'Betalingsgeskiedenis', route: '/settings/payments' },
  ]},
  { section: 'Hulp', items: [
    { icon: 'help-circle-outline', label: 'Hulp & Ondersteuning', route: '/settings/help' },
    { icon: 'document-text-outline', label: 'Diensvoorwaardes', route: '/settings/terms' },
    { icon: 'shield-outline', label: 'Privaatheidsbeleid', route: '/settings/privacy' },
  ]},
];

export default function Settings() {
  const router = useRouter();
  return (
    <View style={s.container}>
      <ScreenHeader title="Instellings" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        {SETTINGS.map(section => (
          <View key={section.section} style={s.section}>
            <SectionHeader title={section.section} />
            {section.items.map(item => (
              <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)}>
                <PlatinumCard style={s.item}>
                  <View style={s.row}>
                    <View style={s.icon}><Ionicons name={item.icon as any} size={18} color={Colors.textBody} /></View>
                    <Text style={[Typography.body, { flex: 1 }]}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </View>
                </PlatinumCard>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  section: { marginBottom: 16 },
  item: { marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
});
