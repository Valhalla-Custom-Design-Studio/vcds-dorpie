import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Radius } from '@/theme';
import { PlatinumCard, SectionHeader } from '@/components/ui';

const SECTIONS = [
  { icon: 'document-text', label: 'Kennisgewingsbord', sub: 'Dorpsaankondigings & nuus', route: '/notices', color: Colors.primary },
  { icon: 'calendar', label: 'Gebeure', sub: "Wat gebeur in jou area", route: '/events', color: Colors.accent },
  { icon: 'chatbubbles', label: 'Forum', sub: 'Besprekings & gemeenskapstopieke', route: '/topics', color: Colors.success },
  { icon: 'bag', label: 'Markplek', sub: 'Koop, verkoop & ruil plaaslik', route: '/listings', color: Colors.warning },
  { icon: 'chatbubble-ellipses', label: 'Boodskappe', sub: 'Privaat gesprekke', route: '/messages', color: Colors.primaryLight },
  { icon: 'storefront', label: 'Besigheidsgids', sub: 'Plaaslike besighede & dienste', route: '/(tabs)/directory', color: Colors.accentBlue },
];

export default function Community() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <LinearGradient colors={[Colors.primary + '33', Colors.bg]} style={[s.hero, { paddingTop: insets.top + 16 }]}>
        <Text style={Typography.h1}>🤝 Gemeenskap</Text>
        <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 4 }]}>Bly verbind met jou bure</Text>
      </LinearGradient>

      <View style={s.content}>
        <SectionHeader title="Gemeenskapskenmerke" />
        <View style={s.list}>
          {SECTIONS.map(item => (
            <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)}>
              <PlatinumCard style={s.card} accentColor={item.color}>
                <View style={s.row}>
                  <View style={[s.icon, { backgroundColor: item.color + '20', borderColor: item.color + '40' }]}>
                    <Ionicons name={item.icon as any} size={26} color={item.color} />
                  </View>
                  <View style={s.content2}>
                    <Text style={Typography.bodySemi}>{item.label}</Text>
                    <Text style={Typography.caption}>{item.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </View>
              </PlatinumCard>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  hero: { paddingHorizontal: 16, paddingBottom: 24 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  list: { gap: 8 },
  card: { marginBottom: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  content2: { flex: 1 },
});
