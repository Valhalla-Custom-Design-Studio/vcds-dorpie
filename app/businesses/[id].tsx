import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Linking, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Shadow } from '@/theme';
import { PlatinumCard, PlatinumButton, ScreenHeader, PlatinumInput } from '@/components/ui';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { businessesAPI } from '@/services/api';
import { useAuthStore } from '@/store/auth';

export default function BusinessDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [biz, setBiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    businessesAPI.get(id!).then(r => setBiz(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const postReview = async () => {
    if (!review.trim()) return;
    setPosting(true);
    try {
      await businessesAPI.review(id!, rating, review.trim());
      setReview('');
      Alert.alert('Resensie geplaas! ✅');
    } catch { Alert.alert('Kon nie resensie plaas nie'); }
    finally { setPosting(false); }
  };

  const isOwner = biz?.owner_id === user?.id;
  const canClaim = !biz?.is_verified && biz?.claim_status !== 'approved' && !isOwner;

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (!biz) return <View style={s.center}><Text style={Typography.body}>Besigheid nie gevind nie</Text></View>;

  return (
    <View style={s.container}>
      <ScreenHeader title={biz.name} showBack />
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Header Card */}
        <PlatinumCard style={s.header}>
          <View style={s.bizAvatar}>
            <Text style={{ fontSize: 40 }}>🏪</Text>
          </View>
          <View style={s.headerInfo}>
            <View style={s.nameRow}>
              <Text style={[Typography.h2, { flex: 1 }]}>{biz.name}</Text>
              {biz.is_verified && (
                <VerifiedBadge badge={biz.verification_badge || 'verified'} size="md" showLabel />
              )}
            </View>
            {biz.category && (
              <Text style={[Typography.caption, { color: Colors.accent, marginTop: 2 }]}>{biz.category}</Text>
            )}
            {biz.avg_rating > 0 && (
              <Text style={[Typography.body, { color: '#FFD700', marginTop: 4 }]}>
                ⭐ {Number(biz.avg_rating).toFixed(1)} ({biz.review_count} resensies)
              </Text>
            )}
          </View>
        </PlatinumCard>

        {/* Owner Actions */}
        {isOwner && (
          <PlatinumCard style={s.ownerCard}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.success} />
            <Text style={[Typography.body, { color: Colors.success, flex: 1, marginLeft: 8 }]}>
              Jy is die eienaar van hierdie besigheid
            </Text>
            <TouchableOpacity onPress={() => router.push(`/businesses/edit?id=${id}`)}>
              <Text style={[Typography.caption, { color: Colors.primary }]}>Wysig</Text>
            </TouchableOpacity>
          </PlatinumCard>
        )}

        {/* Claim Button */}
        {canClaim && (
          <TouchableOpacity style={s.claimBtn} onPress={() => router.push(`/businesses/claim?id=${id}`)}>
            <Ionicons name="flag-outline" size={16} color={Colors.primary} />
            <Text style={s.claimText}>Is dit jou besigheid? Eis dit hier</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Contact Info */}
        <PlatinumCard style={s.section}>
          <Text style={[Typography.label, s.sectionTitle]}>Kontak</Text>
          {biz.phone && (
            <TouchableOpacity style={s.contactRow} onPress={() => Linking.openURL(`tel:${biz.phone}`)}>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
              <Text style={[Typography.body, s.contactText]}>{biz.phone}</Text>
            </TouchableOpacity>
          )}
          {biz.email && (
            <TouchableOpacity style={s.contactRow} onPress={() => Linking.openURL(`mailto:${biz.email}`)}>
              <Ionicons name="mail-outline" size={18} color={Colors.primary} />
              <Text style={[Typography.body, s.contactText]}>{biz.email}</Text>
            </TouchableOpacity>
          )}
          {biz.website && (
            <TouchableOpacity style={s.contactRow} onPress={() => Linking.openURL(biz.website)}>
              <Ionicons name="globe-outline" size={18} color={Colors.primary} />
              <Text style={[Typography.body, s.contactText]}>{biz.website}</Text>
            </TouchableOpacity>
          )}
          {biz.address && (
            <View style={s.contactRow}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
              <Text style={[Typography.body, s.contactText]}>{biz.address}</Text>
            </View>
          )}
        </PlatinumCard>

        {/* Description */}
        {biz.description && (
          <PlatinumCard style={s.section}>
            <Text style={[Typography.label, s.sectionTitle]}>Oor die Besigheid</Text>
            <Text style={[Typography.body, { color: Colors.textBody, lineHeight: 22 }]}>{biz.description}</Text>
          </PlatinumCard>
        )}

        {/* Review Section */}
        <PlatinumCard style={s.section}>
          <Text style={[Typography.label, s.sectionTitle]}>Skryf 'n Resensie</Text>
          <View style={s.stars}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={28} color="#FFD700" />
              </TouchableOpacity>
            ))}
          </View>
          <PlatinumInput
            label=""
            value={review}
            onChangeText={setReview}
            placeholder="Deel jou ervaring..."
            multiline
            numberOfLines={3}
          />
          <PlatinumButton
            title={posting ? 'Plaas...' : 'Plaas Resensie'}
            onPress={postReview}
            disabled={posting || !review.trim()}
            style={{ marginTop: 8 }}
          />
        </PlatinumCard>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 12 },
  headerInfo: { marginTop: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bizAvatar: { alignItems: 'center', paddingVertical: 8 },
  ownerCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderColor: Colors.success },
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.primary, backgroundColor: 'rgba(99,102,241,0.06)',
    marginBottom: 12,
  },
  claimText: { flex: 1, color: Colors.primary, fontSize: 13, fontWeight: '500' },
  section: { marginBottom: 12 },
  sectionTitle: { marginBottom: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  contactText: { color: Colors.textBody, flex: 1 },
  stars: { flexDirection: 'row', gap: 8, marginBottom: 12 },
});
