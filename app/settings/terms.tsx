import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme';
import { ScreenHeader } from '@/components/ui';

export default function Terms() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScreenHeader title="Gebruiksvoorwaardes" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        {[
          { title: '1. Aanvaarding van Voorwaardes', body: 'Deur Dorpwag™ te gebruik, stem jy in tot hierdie voorwaardes. As jy nie saamstem nie, gebruik asseblief nie die app nie.' },
          { title: '2. Gebruiksregte', body: "Dorpwag™ word deur VCDS™ voorsien. Alle regte voorbehou. Jy kry 'n nie-eksklusiewe lisensie om die app te gebruik." },
          { title: '3. SOS & Noodfunksies', body: 'Die SOS-funksie is bedoel vir egte noodgevalle. Misbruik kan tot terminasie van jou rekening lei.' },
          { title: '4. Privaatheid', body: 'Jou persoonlike data word beskerm ingevolge die POPI-wet. Sien ons Privaatheidsbeleid vir besonderhede.' },
          { title: '5. Betalings', body: 'Betalings word verwerk deur PayFast™. Terugbetalings word oorweeg geval per geval.' },
          { title: '6. Aanspreeklikheid', body: 'VCDS™ is nie aanspreeklik vir skade voortspruitend uit die gebruik van Dorpwag™ nie.' },
          { title: '7. Wysigings', body: 'Ons behou die reg voor om hierdie voorwaardes te wysig. Voortgesette gebruik impliseer aanvaarding.' },
        ].map(s2 => (
          <View key={s2.title} style={{ marginBottom: Spacing.lg }}>
            <Text style={[Typography.h4, { marginBottom: 8 }]}>{s2.title}</Text>
            <Text style={Typography.body}>{s2.body}</Text>
          </View>
        ))}
        <Text style={[Typography.caption, { marginTop: Spacing.md }]}>Laas opgedateer: Mei 2026 · VCDS Holdings</Text>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({ scroll: { padding: Spacing.md, paddingBottom: 48 } });
