import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Shadow } from '@/theme';
import { PlatinumCard, PlatinumButton, PlatinumInput, ScreenHeader } from '@/components/ui';
import { businessesAPI } from '@/services/api';

const PROOF_TYPES = [
  { key: 'cipc', label: 'CIPC Registrasie', icon: 'document-text-outline' },
  { key: 'utility_bill', label: 'Munisipale Rekening', icon: 'receipt-outline' },
  { key: 'lease', label: 'Huurooreenkoms', icon: 'home-outline' },
  { key: 'other', label: 'Ander Bewys', icon: 'attach-outline' },
];

export default function ClaimBusiness() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [biz, setBiz] = useState<any>(null);
  const [existingClaim, setExistingClaim] = useState<any>(null);
  const [proofType, setProofType] = useState('cipc');
  const [proofUrl, setProofUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      businessesAPI.get(id!),
      businessesAPI.getClaim(id!),
    ]).then(([bizRes, claimRes]) => {
      setBiz(bizRes.data.data);
      setExistingClaim(claimRes.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const submit = async () => {
    if (!proofUrl.trim()) { Alert.alert('Fout', 'Laai asseblief bewys op'); return; }
    setSubmitting(true);
    try {
      await businessesAPI.submitClaim(id!, { proof_document_url: proofUrl.trim(), proof_type: proofType });
      Alert.alert(
        'Eis Ingedien ✅',
        'Jou eis is ontvang. Ons sal dit binne 48 uur hersien en jou in kennis stel.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert('Fout', e.response?.data?.message || 'Kon nie eis indien nie');
    } finally { setSubmitting(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  // Already approved
  if (existingClaim?.status === 'approved') {
    return (
      <View style={s.container}>
        <ScreenHeader title="Besigheidseis" showBack />
        <View style={s.center}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
          <Text style={[Typography.h2, { marginTop: 16, textAlign: 'center' }]}>Jy is die eienaar</Text>
          <Text style={[Typography.body, { color: Colors.textMuted, textAlign: 'center', marginTop: 8 }]}>
            Hierdie besigheid is aan jou rekening gekoppel.
          </Text>
        </View>
      </View>
    );
  }

  // Pending review
  if (existingClaim?.status === 'pending') {
    return (
      <View style={s.container}>
        <ScreenHeader title="Besigheidseis" showBack />
        <View style={s.center}>
          <Ionicons name="time-outline" size={64} color={Colors.warning} />
          <Text style={[Typography.h2, { marginTop: 16, textAlign: 'center' }]}>Onder Hersiening</Text>
          <Text style={[Typography.body, { color: Colors.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }]}>
            Jou eis is ingedien op {new Date(existingClaim.submitted_at).toLocaleDateString('af-ZA')}.
            Ons sal jou binne 48 uur in kennis stel.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScreenHeader title={`Eis: ${biz?.name || 'Besigheid'}`} showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <PlatinumCard style={s.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={[Typography.body, { color: Colors.textMuted, flex: 1, marginLeft: 8 }]}>
            Bewys dat jy die wettige eienaar of bestuurder van hierdie besigheid is.
            Jou eis sal binne 48 uur hersien word.
          </Text>
        </PlatinumCard>

        <Text style={[Typography.label, s.sectionLabel]}>Tipe Bewys</Text>
        {PROOF_TYPES.map(pt => (
          <TouchableOpacity
            key={pt.key}
            style={[s.proofOption, proofType === pt.key && s.proofOptionActive]}
            onPress={() => setProofType(pt.key)}
          >
            <Ionicons name={pt.icon as any} size={20} color={proofType === pt.key ? Colors.primary : Colors.textMuted} />
            <Text style={[s.proofLabel, proofType === pt.key && { color: Colors.primary }]}>{pt.label}</Text>
            {proofType === pt.key && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} style={{ marginLeft: 'auto' }} />}
          </TouchableOpacity>
        ))}

        <Text style={[Typography.label, s.sectionLabel]}>Bewys URL / Lêer Skakel</Text>
        <PlatinumInput
          label=""
          value={proofUrl}
          onChangeText={setProofUrl}
          placeholder="https://drive.google.com/... of enige publieke skakel"
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 4, marginBottom: 16 }]}>
          Laai jou dokument op na Google Drive, Dropbox of enige ander diens en plak die skakel hier.
        </Text>

        {existingClaim?.status === 'rejected' && (
          <PlatinumCard style={s.rejectedCard}>
            <Ionicons name="close-circle-outline" size={20} color={Colors.red} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[Typography.label, { color: Colors.red }]}>Vorige Eis Verwerp</Text>
              {existingClaim.admin_notes && (
                <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 4 }]}>
                  Rede: {existingClaim.admin_notes}
                </Text>
              )}
            </View>
          </PlatinumCard>
        )}

        <PlatinumButton
          title={submitting ? 'Indien...' : 'Dien Eis In'}
          onPress={submit}
          disabled={submitting}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  scroll: { padding: 16, paddingBottom: 40 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  sectionLabel: { marginBottom: 8, marginTop: 4 },
  proofOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surface,
    marginBottom: 8,
  },
  proofOptionActive: { borderColor: Colors.primary, backgroundColor: 'rgba(99,102,241,0.08)' },
  proofLabel: { fontSize: 14, color: Colors.textBody, fontWeight: '500' },
  rejectedCard: { flexDirection: 'row', alignItems: 'flex-start', borderColor: Colors.red, marginBottom: 16 },
});
