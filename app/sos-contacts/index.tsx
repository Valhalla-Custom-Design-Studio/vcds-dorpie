import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, TextInput, Switch, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { PlatinumCard, PlatinumButton, ScreenHeader, EmptyState } from '@/components/ui';
import { api } from '@/services/api';
import { t } from '@/i18n';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  is_primary: boolean;
  is_active: boolean;
}

// SA Emergency Services — user can override per area
const DEFAULT_EMERGENCY_SERVICES = [
  { key: 'police',    icon: 'shield',        label: 'Polisie (SAPS)',         phone: '10111',  color: '#1565C0' },
  { key: 'ambulance', icon: 'medical',       label: 'Ambulans (EMS)',          phone: '10177',  color: '#C62828' },
  { key: 'fire',      icon: 'flame',         label: 'Brandweer',               phone: '10177',  color: '#E65100' },
  { key: 'nhw',       icon: 'people',        label: 'Gemeenskapswag (NHW)',    phone: '',       color: '#2E7D32' },
  { key: 'childline', icon: 'heart',         label: 'Childline SA',            phone: '116',    color: '#6A1B9A' },
  { key: 'gender_gbv',icon: 'woman',         label: 'GBV Hulplyn',             phone: '0800 428 428', color: '#AD1457' },
];

export default function SOSContactsScreen() {
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Emergency service overrides (stored locally per user)
  const [emergencyOverrides, setEmergencyOverrides] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const res = await api.get('/sos/contacts');
      setContacts(res.data.data || []);
      // Load overrides
      const ovRes = await api.get('/users/emergency-overrides').catch(() => ({ data: { data: {} } }));
      setEmergencyOverrides(ovRes.data.data || {});
    } catch { } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setName(''); setPhone(''); setEmail(''); setIsPrimary(false);
    setEditingId(null); setShowForm(false);
  };

  const openEdit = (c: Contact) => {
    setName(c.name); setPhone(c.phone); setEmail(c.email || '');
    setIsPrimary(c.is_primary); setEditingId(c.id); setShowForm(true);
  };

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert(t('common.error'), 'Naam en nommer is verpligtend');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/sos/contacts/${editingId}`, { name, phone, email, isPrimary });
        Alert.alert('✅', 'Kontak opgedateer');
      } else {
        await api.post('/sos/contacts', { name, phone, email, isPrimary });
        Alert.alert('✅', 'Kontak bygevoeg');
      }
      resetForm();
      await load();
    } catch { Alert.alert(t('common.error')); }
    finally { setSubmitting(false); }
  };

  const deleteContact = (c: Contact) => {
    Alert.alert('Verwyder Kontak', 'Is jy seker?', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/sos/contacts/${c.id}`);
            await load();
          } catch { Alert.alert(t('common.error')); }
        }
      }
    ]);
  };

  const saveEmergencyOverride = async (key: string, value: string) => {
    const updated = { ...emergencyOverrides, [key]: value };
    setEmergencyOverrides(updated);
    await api.put('/users/emergency-overrides', updated).catch(() => {});
  };

  const callNumber = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 80 }} />
    </View>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="SOS Kontakte"
        subtitle="Noodkontakte & Nooddienste"
        onBack={() => {}}
        rightAction={{ icon: 'add-circle', onPress: () => setShowForm(true) }}
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >

        {/* ── Emergency Services ─────────────────────────────────────── */}
        <PlatinumCard style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="call" size={18} color={Colors.accentRed} />
            <Text style={[s.sectionTitle, { color: Colors.accentRed }]}>🚨 Nooddienste</Text>
          </View>
          <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: 12 }]}>
            Standaard SA nommers. Tik om te bel of wysig vir jou area.
          </Text>
          {DEFAULT_EMERGENCY_SERVICES.map(svc => {
            const overridePhone = emergencyOverrides[svc.key];
            const displayPhone = overridePhone !== undefined ? overridePhone : svc.phone;
            return (
              <View key={svc.key} style={s.svcRow}>
                <View style={[s.svcIcon, { backgroundColor: svc.color + '22' }]}>
                  <Ionicons name={svc.icon as any} size={18} color={svc.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.caption, { color: Colors.textPrimary, fontWeight: '600' }]}>{svc.label}</Text>
                  <TextInput
                    style={s.svcInput}
                    value={displayPhone}
                    onChangeText={v => saveEmergencyOverride(svc.key, v)}
                    placeholder="Voer nommer in"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
                {displayPhone ? (
                  <TouchableOpacity style={[s.callBtn, { backgroundColor: svc.color }]} onPress={() => callNumber(displayPhone)}>
                    <Ionicons name="call" size={16} color="#fff" />
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </PlatinumCard>

        {/* ── Personal SOS Contacts ──────────────────────────────────── */}
        <PlatinumCard style={s.section}>
          <View style={s.sectionHeader}>
            <Ionicons name="people" size={18} color={Colors.primary} />
            <Text style={s.sectionTitle}>Persoonlike SOS Kontakte</Text>
          </View>
          <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: 12 }]}>
            Hierdie mense word outomaties in kennis gestel wanneer jy SOS aktiveer.
          </Text>

          {/* Add/Edit Form */}
          {showForm && (
            <View style={s.formCard}>
              <Text style={s.formTitle}>{editingId ? 'Wysig Kontak' : 'Voeg Kontak By'}</Text>

              <Text style={s.label}>Naam *</Text>
              <TextInput style={s.input} value={name} onChangeText={setName}
                placeholder="Jan van der Berg" placeholderTextColor={Colors.textMuted} />

              <Text style={s.label}>Selfoon *</Text>
              <TextInput style={s.input} value={phone} onChangeText={setPhone}
                placeholder="+27 82 123 4567" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />

              <Text style={s.label}>E-pos (opsioneel)</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail}
                placeholder="jan@voorbeeld.co.za" placeholderTextColor={Colors.textMuted} keyboardType="email-address" />

              <View style={s.switchRow}>
                <Text style={[Typography.caption, { color: Colors.textPrimary }]}>Primêre Kontak</Text>
                <Switch value={isPrimary} onValueChange={setIsPrimary} trackColor={{ true: Colors.primary }} />
              </View>

              <View style={s.formBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={resetForm}>
                  <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>Kanselleer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={submit} disabled={submitting}>
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={{ color: '#fff', fontWeight: '700' }}>Stoor</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

          {contacts.length === 0 && !showForm ? (
            <EmptyState
              icon="people-outline"
              title="Geen kontakte nie"
              subtitle="Voeg noodkontakte by sodat hulle gewaarsku kan word"
              action={{ label: 'Voeg By', onPress: () => setShowForm(true) }}
            />
          ) : (
            contacts.map(c => (
              <View key={c.id} style={s.contactRow}>
                <View style={s.contactAvatar}>
                  <Text style={s.contactInitial}>{c.name[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[Typography.body, { color: Colors.textPrimary, fontWeight: '600' }]}>{c.name}</Text>
                    {c.is_primary && (
                      <View style={s.primaryBadge}>
                        <Text style={s.primaryBadgeText}>Primêr</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[Typography.caption, { color: Colors.textMuted }]}>{c.phone}</Text>
                  {c.email ? <Text style={[Typography.caption, { color: Colors.textMuted }]}>{c.email}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => callNumber(c.phone)} style={s.iconBtn}>
                  <Ionicons name="call" size={18} color={Colors.accentGreen} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openEdit(c)} style={s.iconBtn}>
                  <Ionicons name="pencil" size={18} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteContact(c)} style={s.iconBtn}>
                  <Ionicons name="trash" size={18} color={Colors.accentRed} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </PlatinumCard>

        {/* Medical Profile shortcut */}
        <TouchableOpacity
          style={s.medicalLink}
          onPress={() => {}}
        >
          <Ionicons name="medkit" size={20} color={Colors.accentRed} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[Typography.body, { color: Colors.textPrimary, fontWeight: '600' }]}>Mediese Profiel</Text>
            <Text style={[Typography.caption, { color: Colors.textMuted }]}>Bloedgroep, allergieë, medikasie — gestuur met SOS</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, gap: 12, paddingBottom: 40 },
  section: { marginBottom: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionTitle: { ...Typography.h3, color: Colors.textPrimary },
  svcRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  svcIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  svcInput: {
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    paddingHorizontal: 10, paddingVertical: 6, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.surfaceBorder, fontSize: 13, marginTop: 2,
  },
  callBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  formCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 16, marginBottom: 12 },
  formTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: 12 },
  label: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4, marginTop: 8 },
  input: {
    backgroundColor: Colors.bg, borderRadius: Radius.sm,
    paddingHorizontal: 12, paddingVertical: 10, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.surfaceBorder, fontSize: 14,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder, alignItems: 'center',
  },
  saveBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  contactAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary + '33', alignItems: 'center', justifyContent: 'center',
  },
  contactInitial: { color: Colors.primary, fontWeight: '700', fontSize: 16 },
  primaryBadge: { backgroundColor: Colors.accentGreen + '33', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  primaryBadgeText: { color: Colors.accentGreen, fontSize: 10, fontWeight: '700' },
  iconBtn: { padding: 6 },
  medicalLink: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
});
