import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, TextInput, Switch,
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

  const load = async () => {
    try {
      const res = await api.get('/sos/contacts');
      setContacts(res.data.data || []);
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
      Alert.alert(t('common.error'), t('sosContacts.name') + ' en ' + t('sosContacts.phone') + ' is verpligtend');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/sos/contacts/${editingId}`, { name, phone, email, isPrimary });
        Alert.alert('✅', t('sosContacts.updateSuccess'));
      } else {
        await api.post('/sos/contacts', { name, phone, email, isPrimary });
        Alert.alert('✅', t('sosContacts.addSuccess'));
      }
      resetForm();
      await load();
    } catch { Alert.alert(t('common.error')); }
    finally { setSubmitting(false); }
  };

  const deleteContact = (c: Contact) => {
    Alert.alert(t('sosContacts.editContact'), t('sosContacts.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/sos/contacts/${c.id}`);
            Alert.alert('✅', t('sosContacts.deleteSuccess'));
            await load();
          } catch { Alert.alert(t('common.error')); }
        }
      }
    ]);
  };

  if (loading) return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 80 }} />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t('sosContacts.title')}
        subtitle={t('sosContacts.subtitle')}
        onBack={() => {}}
        rightAction={{ icon: 'add-circle', onPress: () => setShowForm(true) }}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {/* Add/Edit Form */}
        {showForm && (
          <PlatinumCard style={styles.formCard}>
            <Text style={styles.formTitle}>{editingId ? t('sosContacts.editContact') : t('sosContacts.addContact')}</Text>

            <Text style={styles.label}>{t('sosContacts.name')} *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Jan van der Berg"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>{t('sosContacts.phone')} *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+27 82 123 4567"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>{t('sosContacts.email')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="jan@voorbeeld.co.za"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.switchRow}>
              <Text style={styles.label}>{t('sosContacts.primary')}</Text>
              <Switch
                value={isPrimary}
                onValueChange={setIsPrimary}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.formButtons}>
              <PlatinumButton
                label={t('common.cancel')}
                onPress={resetForm}
                variant="ghost"
                style={{ flex: 1, marginRight: 8 }}
              />
              <PlatinumButton
                label={editingId ? t('common.save') : t('sosContacts.add')}
                onPress={submit}
                loading={submitting}
                style={{ flex: 1 }}
              />
            </View>
          </PlatinumCard>
        )}

        {/* Contacts List */}
        {contacts.length === 0 && !showForm ? (
          <EmptyState
            icon="people-outline"
            title={t('sosContacts.noContacts')}
            description={t('sosContacts.noContactsDesc')}
            ctaLabel={t('sosContacts.addContact')}
            onCta={() => setShowForm(true)}
          />
        ) : (
          contacts.map((c) => (
            <PlatinumCard key={c.id} style={styles.contactCard}>
              <View style={styles.contactRow}>
                <View style={[styles.avatar, c.is_primary && styles.avatarPrimary]}>
                  <Ionicons name="person" size={20} color={c.is_primary ? Colors.primary : Colors.textMuted} />
                </View>
                <View style={styles.contactInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    {c.is_primary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>Primêr</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.contactPhone}>{c.phone}</Text>
                  {c.email ? <Text style={styles.contactEmail}>{c.email}</Text> : null}
                </View>
                <View style={styles.contactActions}>
                  <TouchableOpacity onPress={() => openEdit(c)} style={styles.actionBtn}>
                    <Ionicons name="pencil" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteContact(c)} style={styles.actionBtn}>
                    <Ionicons name="trash" size={18} color={Colors.accentRed} />
                  </TouchableOpacity>
                </View>
              </View>
            </PlatinumCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, paddingBottom: 100 },
  formCard: { marginBottom: Spacing.md },
  formTitle: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.md },
  label: { ...Typography.caption, color: Colors.textMuted, marginBottom: 4, marginTop: Spacing.sm },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    color: Colors.textPrimary,
    ...Typography.body,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  formButtons: { flexDirection: 'row', marginTop: Spacing.md },
  contactCard: { marginBottom: Spacing.sm },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarPrimary: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  contactInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactName: { ...Typography.bodyBold, color: Colors.textPrimary },
  contactPhone: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  contactEmail: { ...Typography.caption, color: Colors.textMuted, marginTop: 1 },
  primaryBadge: {
    backgroundColor: Colors.primary + '30',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  primaryBadgeText: { ...Typography.tiny, color: Colors.primary, fontWeight: '700' },
  contactActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8 },
});
