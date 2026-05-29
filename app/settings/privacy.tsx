import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme';
import { ScreenHeader } from '@/components/ui';

export default function Privacy() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScreenHeader title="Privaatheidsbeleid" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        {[
          { title: 'Inligting wat ons insamel', body: 'Naam, e-posadres, selfoon, liggingsdata (slegs tydens aktiewe sessions), toestel-ID vir kennisgewings.' },
          { title: 'Hoe ons dit gebruik', body: 'Om noodalarms te stuur, jou veiligheid te verseker, personaliseerde kennisgewings te verskaf, en die app te verbeter.' },
          { title: 'Liggingsdata', body: 'Liggingsdata word slegs gebruik tydens Guardian Mode™, SOS-sesssies, en beweging-incheckings. Dit word nie gestoor na die sessie nie.' },
          { title: 'Deel van data', body: 'Ons verkoop of deel nie jou persoonlike data met derde partye nie, behalwe soos vereis deur wet.' },
          { title: 'Jou regte (POPI)', body: 'Jy het die reg om toegang tot, regstelling van, en uitwissing van jou persoonlike data te versoek. Kontak support@vcds.co.za.' },
          { title: 'Sekuriteit', body: 'Alle data word geënkripteer tydens oordrag (TLS 1.3) en in rus. Wagwoorde word gehash met bcrypt.' },
          { title: 'Koekies', body: 'Ons gebruik geen derde-party opsporing-koekies nie. Slegs sessie-tokens word in veilige stoor gebêre.' },
        ].map(s2 => (
          <View key={s2.title} style={{ marginBottom: Spacing.lg }}>
            <Text style={[Typography.h4, { marginBottom: 8 }]}>{s2.title}</Text>
            <Text style={Typography.body}>{s2.body}</Text>
          </View>
        ))}
        <Text style={[Typography.caption, { marginTop: Spacing.md }]}>Laas opgedateer: Mei 2026 · VCDS Holdings · Voldoen aan POPI-wet</Text>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({ scroll: { padding: Spacing.md, paddingBottom: 48 } });
