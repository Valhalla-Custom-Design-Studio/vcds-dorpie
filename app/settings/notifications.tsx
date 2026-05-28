import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Colors, Typography, Spacing } from '../../src/theme';
import { ScreenHeader, PlatinumCard } from '../../src/components/ui';

const NOTIF_SETTINGS = [
  { key: 'sos_alerts', label: 'SOS Noodalarms', desc: "Ontvang kennisgewings wanneer 'n SOS in jou dorp geaktiveer word" },
  { key: 'incidents', label: 'Voorvalle', desc: 'Nuwe misdaadverslae naby jou' },
  { key: 'notices', label: 'Kennisgewings', desc: 'Gemeenskap kennisgewings en aankondigings' },
  { key: 'events', label: 'Geleenthede', desc: 'Plaaslike geleenthede in jou dorp' },
  { key: 'patrols', label: 'Patrollies', desc: 'Patrollie skedule-opdaterings' },
  { key: 'messages', label: 'Boodskappe', desc: 'Nuwe privaat boodskappe' },
  { key: 'guardian', label: 'Guardian Mode™', desc: 'Guardian ping-opdaterings' },
];

export default function NotificationsSettings() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIF_SETTINGS.map(n => [n.key, true]))
  );

  return (
    <View style={s.container}>
      <ScreenHeader title="Kennisgewings" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <PlatinumCard style={s.card}>
          {NOTIF_SETTINGS.map((setting, i) => (
            <View key={setting.key} style={[s.item, i < NOTIF_SETTINGS.length - 1 && s.border]}>
              <View style={{ flex: 1 }}>
                <Text style={Typography.h4}>{setting.label}</Text>
                <Text style={[Typography.caption, { marginTop: 2, flexWrap: 'wrap' }]}>{setting.desc}</Text>
              </View>
              <Switch
                value={enabled[setting.key]}
                onValueChange={v => setEnabled(p => ({ ...p, [setting.key]: v }))}
                trackColor={{ true: Colors.primary, false: Colors.surfaceBorder }}
                thumbColor={enabled[setting.key] ? Colors.accent : Colors.textMuted}
              />
            </View>
          ))}
        </PlatinumCard>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, paddingBottom: 48 },
  card: { padding: 0, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
});
