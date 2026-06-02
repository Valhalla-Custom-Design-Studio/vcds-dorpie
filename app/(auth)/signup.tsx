import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Modal, TextInput, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/theme';
import { PrimaryButton, InputField } from '@/components/ui';
import { authAPI, townsAPI } from '@/services/api';
import { useAuthStore } from '@/store/auth';

// Jordaanpark promo config
const JPF_PROMO_CODE = '#JPF2026';
const JPF_PROMO_EXPIRY = new Date('2026-06-30T23:59:59+02:00');
const JORDAANPARK_SLUG = 'jordaanpark';

// Fallback towns — shown while API loads or if API fails.
// Jordaanpark is hardcoded so promo flow always works.
// IDs are placeholders; real UUID is resolved from API response.
const FALLBACK_TOWNS: { id: string; name: string; province: string }[] = [
  { id: '__jordaanpark__', name: 'Jordaanpark', province: 'Gauteng' },
  { id: '__heidelberg__', name: 'Heidelberg', province: 'Gauteng' },
];

function isJordaanpark(towns: any[], townId: string): boolean {
  if (!townId) return false;
  // Handle placeholder fallback ID
  if (townId === '__jordaanpark__') return true;
  const town = towns.find(t => t.id === townId);
  return !!town && town.name.toLowerCase().replace(/\s/g, '') === JORDAANPARK_SLUG;
}

function isPromoValid(): boolean {
  return new Date() <= JPF_PROMO_EXPIRY;
}

export default function Signup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setAuth = useAuthStore(s => s.setAuth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [townId, setTownId] = useState('');
  const [towns, setTowns] = useState<any[]>(FALLBACK_TOWNS);
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Town picker modal state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [townSearch, setTownSearch] = useState('');

  useEffect(() => {
    townsAPI.list()
      .then(r => {
        const apiTowns: any[] = r.data.data || [];
        if (apiTowns.length > 0) {
          // Always ensure Jordaanpark is present with its real UUID
          const hasJP = apiTowns.some((t: any) =>
            t.name.toLowerCase().replace(/\s/g, '') === JORDAANPARK_SLUG
          );
          setTowns(hasJP ? apiTowns : [
            { id: '__jordaanpark__', name: 'Jordaanpark', province: 'Gauteng' },
            ...apiTowns,
          ]);
          // If user had selected a placeholder, swap to real UUID
          setTownId(prev => {
            if (prev === '__jordaanpark__') {
              const real = apiTowns.find((t: any) =>
                t.name.toLowerCase().replace(/\s/g, '') === JORDAANPARK_SLUG
              );
              return real ? real.id : prev;
            }
            if (prev === '__heidelberg__') {
              const real = apiTowns.find((t: any) =>
                t.name.toLowerCase() === 'heidelberg'
              );
              return real ? real.id : prev;
            }
            return prev;
          });
        }
      })
      .catch(() => {
        // Keep fallback list — user can still register, UUID resolved on backend
      });
  }, []);

  const filteredTowns = useMemo(() =>
    towns.filter(t =>
      `${t.name} ${t.province}`.toLowerCase().includes(townSearch.toLowerCase())
    ),
    [towns, townSearch]
  );

  const selectedTown = towns.find(t => t.id === townId);
  const showPromo = isJordaanpark(towns, townId);

  const handleSignup = async () => {
    if (!name || !email || !password) { setError('Naam, e-pos en wagwoord is verpligtend.'); return; }
    if (password.length < 8) { setError('Wagwoord moet minstens 8 karakters wees.'); return; }

    if (showPromo) {
      if (!promoCode.trim()) {
        setError('Voer asseblief die Jordaanpark promosiekode in om te registreer.');
        return;
      }
      if (promoCode.trim().toUpperCase() !== JPF_PROMO_CODE.toUpperCase()) {
        setError('Ongeldige promosiekode. Gebruik #JPF2026.');
        return;
      }
      if (!isPromoValid()) {
        setError('Hierdie promosiekode het verval. Kontak jou dorpsadministrateur.');
        return;
      }
    }

    setLoading(true); setError('');
    try {
      // Resolve placeholder town IDs — if API never loaded, send name instead
      // Backend will resolve by name if townId starts with '__'
      const resolvedTownId = townId.startsWith('__') ? undefined : (townId || undefined);
      const resolvedTownName = townId === '__jordaanpark__' ? 'Jordaanpark'
        : townId === '__heidelberg__' ? 'Heidelberg' : undefined;

      const res = await authAPI.signup({
        name,
        email: email.trim().toLowerCase(),
        password,
        townId: resolvedTownId,
        townName: resolvedTownName,
        phone: phone || undefined,
        promoCode: showPromo && promoCode ? promoCode.trim() : undefined,
      });
      const { user, access_token } = res.data.data;
      setAuth(user, access_token);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Registrasie het misluk. Probeer weer.');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[s.container, { paddingTop: insets.top }]} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.textBody} />
        </TouchableOpacity>

        <View style={s.header}>
          <Ionicons name="shield-checkmark" size={40} color={Colors.accent} />
          <Text style={s.title}>Skep Rekening</Text>
          <Text style={s.subtitle}>Sluit aan by jou plaaslike Dorpwag™ gemeenskap</Text>
        </View>

        {error ? <View style={s.errorBanner}><Text style={s.errorText}>{error}</Text></View> : null}

        <InputField label="Volle Naam" value={name} onChangeText={setName} placeholder="Jan van der Berg" icon="person-outline" />
        <InputField label="E-posadres" value={email} onChangeText={setEmail} placeholder="jou@epos.co.za" keyboardType="email-address" icon="mail-outline" />
        <InputField label="Selfoon (opsioneel)" value={phone} onChangeText={setPhone} placeholder="+27 82 000 0000" keyboardType="phone-pad" icon="call-outline" />
        <InputField label="Wagwoord" value={password} onChangeText={setPassword} placeholder="Min. 8 karakters" secureTextEntry icon="lock-closed-outline" />

        {/* Searchable town picker */}
        <Text style={s.pickerLabel}>DORP</Text>
        <TouchableOpacity style={s.pickerContainer} onPress={() => setPickerVisible(true)} activeOpacity={0.8}>
          <Ionicons name="location-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <Text style={selectedTown ? s.pickerValue : s.pickerPlaceholder}>
            {selectedTown ? `${selectedTown.name}, ${selectedTown.province}` : 'Kies jou dorp...'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {showPromo && (
          <View style={s.promoContainer}>
            <View style={s.promoHeader}>
              <Ionicons name="ticket-outline" size={18} color={Colors.accent} />
              <Text style={s.promoLabel}>JORDAANPARK PROMOSIEKODE (VERPLIGTEND)</Text>
            </View>
            <InputField
              label=""
              value={promoCode}
              onChangeText={setPromoCode}
              placeholder="#JPF2026"
              icon="key-outline"
              autoCapitalize="characters"
            />
            <Text style={s.promoHint}>Voer jou Jordaanpark Fees 2026 promosiekode in vir gratis volledige toegang.</Text>
          </View>
        )}

        <PrimaryButton title="Registreer Gratis" onPress={handleSignup} loading={loading} variant="accent" style={{ marginTop: Spacing.md }} />

        <View style={s.loginRow}>
          <Text style={s.loginText}>Het jy al 'n rekening? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={s.loginLink}>Teken In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Town search modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Kies Dorp</Text>
              <TouchableOpacity onPress={() => { setPickerVisible(false); setTownSearch(''); }}>
                <Ionicons name="close" size={24} color={Colors.textBody} />
              </TouchableOpacity>
            </View>
            <View style={s.searchRow}>
              <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={s.searchInput}
                placeholder="Soek dorp..."
                placeholderTextColor={Colors.textMuted}
                value={townSearch}
                onChangeText={setTownSearch}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredTowns}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.townItem, item.id === townId && s.townItemSelected]}
                  onPress={() => { setTownId(item.id); setPickerVisible(false); setTownSearch(''); }}
                >
                  <Text style={[s.townName, item.id === townId && s.townNameSelected]}>
                    {item.name}
                  </Text>
                  <Text style={s.townProvince}>{item.province}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={s.noResults}>Geen dorpe gevind nie</Text>}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  back: { marginBottom: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  title: { ...Typography.h2, marginTop: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
  errorBanner: { backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 8, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.error },
  errorText: { color: Colors.error, fontSize: 14 },
  pickerLabel: { ...Typography.label, marginBottom: 6 },
  pickerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.surfaceBorder, padding: 14, marginBottom: Spacing.md },
  pickerPlaceholder: { flex: 1, color: Colors.textMuted, fontSize: 15 },
  pickerValue: { flex: 1, color: Colors.textHeading, fontSize: 15 },
  promoContainer: { backgroundColor: 'rgba(255,180,0,0.07)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,180,0,0.3)', padding: Spacing.md, marginBottom: Spacing.md },
  promoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  promoLabel: { ...Typography.label, color: Colors.accent, fontSize: 11 },
  promoHint: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  loginText: { color: Colors.textMuted, fontSize: 14 },
  loginLink: { color: Colors.accent, fontSize: 14, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  modalTitle: { ...Typography.h3 },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: Spacing.md, backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.surfaceBorder },
  searchInput: { flex: 1, color: Colors.textHeading, fontSize: 15 },
  townItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  townItemSelected: { backgroundColor: 'rgba(255,180,0,0.08)' },
  townName: { color: Colors.textHeading, fontSize: 15 },
  townNameSelected: { color: Colors.accent, fontWeight: '600' },
  townProvince: { color: Colors.textMuted, fontSize: 13 },
  noResults: { color: Colors.textMuted, textAlign: 'center', padding: Spacing.xl },
});
