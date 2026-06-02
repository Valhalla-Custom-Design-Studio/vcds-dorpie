import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { PlatinumCard, PlatinumButton, ScreenHeader } from '@/components/ui';
import { api } from '@/services/api';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Onbekend'];

interface MedicalProfile {
  blood_type: string;
  allergies: string;
  conditions: string;
  medications: string;
  doctor_name: string;
  doctor_phone: string;
  medical_aid: string;
  medical_aid_number: string;
  notes: string;
}

const EMPTY: MedicalProfile = {
  blood_type: '',
  allergies: '',
  conditions: '',
  medications: '',
  doctor_name: '',
  doctor_phone: '',
  medical_aid: '',
  medical_aid_number: '',
  notes: '',
};

export default function MedicalProfileScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<MedicalProfile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/users/medical-profile')
      .then(r => { if (r.data.data) setProfile({ ...EMPTY, ...r.data.data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof MedicalProfile, val: string) =>
    setProfile(p => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/users/medical-profile', profile);
      Alert.alert('✅ Gestoor', 'Jou mediese profiel is opgedateer. Dit word saam met elke SOS gestuur.');
    } catch {
      Alert.alert('Fout', 'Kon nie stoor nie. Probeer weer.');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 80 }} />
    </View>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Mediese Profiel"
        subtitle="Gestuur saam met elke SOS noodsein"
        onBack={() => {}}
      />
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}>

        {/* Blood Type */}
        <PlatinumCard style={s.card}>
          <Text style={s.sectionTitle}>🩸 Bloedgroep</Text>
          <View style={s.bloodGrid}>
            {BLOOD_TYPES.map(bt => (
              <TouchableOpacity
                key={bt}
                style={[s.bloodBtn, profile.blood_type === bt && s.bloodBtnActive]}
                onPress={() => set('blood_type', bt)}
              >
                <Text style={[s.bloodBtnText, profile.blood_type === bt && s.bloodBtnTextActive]}>
                  {bt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </PlatinumCard>

        {/* Medical details */}
        <PlatinumCard style={s.card}>
          <Text style={s.sectionTitle}>⚕️ Mediese Inligting</Text>

          <Text style={s.label}>Allergieë</Text>
          <TextInput
            style={s.input}
            value={profile.allergies}
            onChangeText={v => set('allergies', v)}
            placeholder="bv. Penisillien, Erdneute, Latex"
            placeholderTextColor={Colors.textMuted}
            multiline
          />

          <Text style={s.label}>Mediese Toestande</Text>
          <TextInput
            style={s.input}
            value={profile.conditions}
            onChangeText={v => set('conditions', v)}
            placeholder="bv. Diabetes, Epilepsie, Hartsiekte"
            placeholderTextColor={Colors.textMuted}
            multiline
          />

          <Text style={s.label}>Medikasie</Text>
          <TextInput
            style={s.input}
            value={profile.medications}
            onChangeText={v => set('medications', v)}
            placeholder="bv. Metformin 500mg, Warfarin"
            placeholderTextColor={Colors.textMuted}
            multiline
          />

          <Text style={s.label}>Addisionele Notas</Text>
          <TextInput
            style={[s.input, { minHeight: 80 }]}
            value={profile.notes}
            onChangeText={v => set('notes', v)}
            placeholder="Enige ander belangrike mediese inligting..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
        </PlatinumCard>

        {/* Doctor */}
        <PlatinumCard style={s.card}>
          <Text style={s.sectionTitle}>👨‍⚕️ Dokter / Noodkontakte</Text>

          <Text style={s.label}>Dokter se Naam</Text>
          <TextInput
            style={s.input}
            value={profile.doctor_name}
            onChangeText={v => set('doctor_name', v)}
            placeholder="Dr. Pieter van der Merwe"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={s.label}>Dokter se Nommer</Text>
          <TextInput
            style={s.input}
            value={profile.doctor_phone}
            onChangeText={v => set('doctor_phone', v)}
            placeholder="+27 11 123 4567"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
          />

          <Text style={s.label}>Mediese Fonds</Text>
          <TextInput
            style={s.input}
            value={profile.medical_aid}
            onChangeText={v => set('medical_aid', v)}
            placeholder="bv. Discovery, Bonitas, Momentum"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={s.label}>Mediese Fonds Nommer</Text>
          <TextInput
            style={s.input}
            value={profile.medical_aid_number}
            onChangeText={v => set('medical_aid_number', v)}
            placeholder="Lidmaatskapnommer"
            placeholderTextColor={Colors.textMuted}
          />
        </PlatinumCard>

        <PlatinumButton
          label={saving ? 'Stoor...' : '💾 Stoor Mediese Profiel'}
          onPress={save}
          disabled={saving}
          style={{ marginTop: 8 }}
        />

        <View style={s.infoBox}>
          <Ionicons name="information-circle" size={16} color={Colors.textMuted} />
          <Text style={[Typography.caption, { color: Colors.textMuted, flex: 1, marginLeft: 8 }]}>
            Hierdie inligting word slegs gestuur wanneer jy 'n SOS noodsein aktiveer. Dit word veilig gestoor en nooit met derde partye gedeel nie.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, gap: 12 },
  card: { marginBottom: 4 },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 14 },
  label: { ...Typography.caption, color: Colors.textMuted, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 10, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.surfaceBorder, fontSize: 14,
  },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bloodBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.surfaceBorder, backgroundColor: Colors.surface,
  },
  bloodBtnActive: { backgroundColor: Colors.accentRed, borderColor: Colors.accentRed },
  bloodBtnText: { color: Colors.textMuted, fontWeight: '600', fontSize: 13 },
  bloodBtnTextActive: { color: '#fff' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: 12, marginTop: 8,
  },
});
