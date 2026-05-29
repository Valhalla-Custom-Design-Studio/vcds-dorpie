import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { useAuthStore } from '@/store/auth';
import { api } from '@/services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const [sosAlerts, setSosAlerts] = useState(true);
  const [patrolAlerts, setPatrolAlerts] = useState(true);
  const [noticeAlerts, setNoticeAlerts] = useState(true);
  const [lang, setLang] = useState<'af' | 'en'>('af');

  const handleLogout = () => {
    Alert.alert('Teken Uit', 'Is jy seker?', [
      { text: 'Kanselleer', style: 'cancel' },
      { text: 'Teken Uit', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/welcome'); } },
    ]);
  };

  const savePrefs = async () => {
    try {
      await api.put('/profile/notifications', { sos_alerts: sosAlerts, patrol_alerts: patrolAlerts, notice_alerts: noticeAlerts });
      Alert.alert('Gestoor', 'Instellings opgedateer.');
    } catch {
      Alert.alert('Fout', 'Kon nie stoor nie.');
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={[Typography.h2, { marginBottom: Spacing.lg }]}>Instellings</Text>

      <Text style={s.section}>Kennisgewings</Text>
      <View style={s.row}>
        <Text style={s.label}>SOS Waarskuwings</Text>
        <Switch value={sosAlerts} onValueChange={setSosAlerts} trackColor={{ true: Colors.primary }} />
      </View>
      <View style={s.row}>
        <Text style={s.label}>Patrollie Waarskuwings</Text>
        <Switch value={patrolAlerts} onValueChange={setPatrolAlerts} trackColor={{ true: Colors.primary }} />
      </View>
      <View style={s.row}>
        <Text style={s.label}>Kennisgewing Waarskuwings</Text>
        <Switch value={noticeAlerts} onValueChange={setNoticeAlerts} trackColor={{ true: Colors.primary }} />
      </View>

      <Text style={s.section}>Taal</Text>
      <View style={s.langRow}>
        <TouchableOpacity style={[s.langBtn, lang === 'af' && s.langActive]} onPress={() => setLang('af')}>
          <Text style={[s.langText, lang === 'af' && s.langActiveText]}>Afrikaans</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.langBtn, lang === 'en' && s.langActive]} onPress={() => setLang('en')}>
          <Text style={[s.langText, lang === 'en' && s.langActiveText]}>English</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.saveBtn} onPress={savePrefs}>
        <Text style={s.saveBtnText}>Stoor Instellings</Text>
      </TouchableOpacity>

      <Text style={s.section}>Rekening</Text>
      <TouchableOpacity style={s.dangerBtn} onPress={handleLogout}>
        <Text style={s.dangerText}>Teken Uit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.dangerBtn, { marginTop: Spacing.sm }]} onPress={() => router.push('/subscribe')}>
        <Text style={s.dangerText}>Bestuur Intekening</Text>
      </TouchableOpacity>

      <Text style={s.version}>Dorpwag™ v2.1.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 48 },
  section: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceBorder },
  label: { fontSize: 15, color: Colors.textHeading },
  langRow: { flexDirection: 'row', gap: Spacing.sm },
  langBtn: { flex: 1, padding: 12, borderRadius: Radius.md, backgroundColor: Colors.surface, alignItems: 'center', borderWidth: 1, borderColor: Colors.surfaceBorder },
  langActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  langText: { color: Colors.textMuted, fontWeight: '600' },
  langActiveText: { color: '#fff' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 14, alignItems: 'center', marginTop: Spacing.md },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dangerBtn: { backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: Radius.md, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.error },
  dangerText: { color: Colors.error, fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 12, marginTop: 40 },
});
