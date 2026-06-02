import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius } from '@/theme';

const PIN_OPTIONS = ['0000', '1234', '9999', '1111', '2580'];

export default function PhantomSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [shakeEnabled, setShakeEnabled] = useState(true);
  const [volumeEnabled, setVolumeEnabled] = useState(true);
  const [selectedPin, setSelectedPin] = useState('0000');

  const openCalculator = () => {
    router.push('/phantom-alert');
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('phantom_pin', selectedPin);
      await AsyncStorage.setItem('phantom_shake', String(shakeEnabled));
      await AsyncStorage.setItem('phantom_volume', String(volumeEnabled));
      Alert.alert('Gestoor', 'Phantom Alert™ instellings gestoor.');
    } catch {
      Alert.alert('Fout', 'Kon nie stoor nie.');
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.textHeading} />
        </TouchableOpacity>
        <Text style={Typography.h3}>Phantom Alert™</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}>
        {/* Info Banner */}
        <View style={s.infoBanner}>
          <Ionicons name="eye-off" size={20} color={Colors.accentViolet} />
          <Text style={[Typography.bodySmall, { color: Colors.textBody, flex: 1 }]}>
            Phantom Alert™ vermom as 'n sakrekenaar. Tik jou geheime PIN om 'n stille SOS te stuur — geen sigbare aanduiding op jou foon nie.
          </Text>
        </View>

        {/* Open Calculator */}
        <TouchableOpacity style={s.card} onPress={openCalculator}>
          <View style={s.cardRow}>
            <View style={[s.iconWrap, { backgroundColor: Colors.accentViolet + '22' }]}>
              <Ionicons name="calculator" size={22} color={Colors.accentViolet} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={Typography.bodySemi}>Maak Sakrekenaar Oop</Text>
              <Text style={[Typography.caption, { color: Colors.textMuted }]}>Toets jou Phantom PIN</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* PIN Selection */}
        <View style={s.section}>
          <Text style={[Typography.label, { marginBottom: Spacing.sm }]}>GEHEIME PIN</Text>
          <View style={s.pinGrid}>
            {PIN_OPTIONS.map(pin => (
              <TouchableOpacity
                key={pin}
                style={[s.pinBtn, selectedPin === pin && s.pinBtnActive]}
                onPress={() => setSelectedPin(pin)}
              >
                <Text style={[s.pinText, selectedPin === pin && { color: '#fff' }]}>{pin}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 8 }]}>
            Tik hierdie PIN op die sakrekenaar gevolg deur "=" om SOS te aktiveer.
          </Text>
        </View>

        {/* Trigger Options */}
        <View style={s.section}>
          <Text style={[Typography.label, { marginBottom: Spacing.sm }]}>SNELLERS</Text>

          <View style={s.toggleRow}>
            <View style={s.toggleInfo}>
              <Ionicons name="phone-portrait" size={18} color={Colors.accentPurple} />
              <View style={{ flex: 1 }}>
                <Text style={Typography.bodySemi}>Skud-sneller</Text>
                <Text style={[Typography.caption, { color: Colors.textMuted }]}>3 vinnige skuddings → stille SOS</Text>
              </View>
            </View>
            <Switch
              value={shakeEnabled}
              onValueChange={setShakeEnabled}
              trackColor={{ false: Colors.surface, true: Colors.accentViolet }}
              thumbColor="#fff"
            />
          </View>

          <View style={[s.toggleRow, { marginTop: Spacing.sm }]}>
            <View style={s.toggleInfo}>
              <Ionicons name="volume-high" size={18} color={Colors.accentBlue} />
              <View style={{ flex: 1 }}>
                <Text style={Typography.bodySemi}>Volume-knoppie-sneller</Text>
                <Text style={[Typography.caption, { color: Colors.textMuted }]}>3× Volume Op binne 2s → stille SOS</Text>
              </View>
            </View>
            <Switch
              value={volumeEnabled}
              onValueChange={setVolumeEnabled}
              trackColor={{ false: Colors.surface, true: Colors.accentBlue }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={s.saveBtn} onPress={saveSettings}>
          <Text style={[Typography.button, { color: '#fff' }]}>Stoor Instellings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  infoBanner: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.accentViolet + '15',
    borderWidth: 1, borderColor: Colors.accentViolet + '30',
    borderRadius: Radius.md, padding: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  section: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  pinGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pinBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  pinBtnActive: { backgroundColor: Colors.accentViolet, borderColor: Colors.accentViolet },
  pinText: { color: Colors.textBody, fontSize: 16, fontWeight: '600', fontFamily: 'monospace' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  saveBtn: {
    backgroundColor: Colors.accentViolet, borderRadius: Radius.md,
    paddingVertical: 16, alignItems: 'center',
  },
});
