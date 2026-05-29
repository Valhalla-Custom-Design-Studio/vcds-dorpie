import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/theme';
import { PlatinumCard, PlatinumButton, ScreenHeader, PlatinumInput } from '@/components/ui';
import { businessesAPI } from '@/services/api';

export default function BusinessDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
    try { await businessesAPI.review(id!, rating, review.trim()); setReview(''); Alert.alert('Review posted!'); }
    catch { Alert.alert('Failed to post review'); }
    finally { setPosting(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (!biz) return <View style={s.center}><Text style={Typography.body}>Business not found</Text></View>;

  return (
    <View style={s.container}>
      <ScreenHeader title={biz.name} showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <PlatinumCard style={s.header}>
          <View style={s.bizAvatar}><Text style={{ fontSize: 40 }}>🏪</Text></View>
          <Text style={Typography.h2}>{biz.name}</Text>
          {biz.category ? <Text style={[Typography.caption, { color: Colors.accent }]}>{biz.category}</Text> : null}
          {biz.avg_rating ? <Text style={[Typography.body, { color: Colors.accent, marginTop: 4 }]}>⭐ {Number(biz.avg_rating).toFixed(1)} / 5.0</Text> : null}
          <Text style={[Typography.body, { marginTop: 8, lineHeight: 22 }]}>{biz.description}</Text>
        </PlatinumCard>

        {/* Contact */}
        <PlatinumCard>
          <Text style={[Typography.h3, { marginBottom: 12 }]}>Contact</Text>
          {[
            { icon: 'call', label: biz.phone, action: () => Linking.openURL(`tel:${biz.phone}`) },
            { icon: 'mail', label: biz.email, action: () => Linking.openURL(`mailto:${biz.email}`) },
            { icon: 'location', label: biz.address, action: null },
          ].filter(c => c.label).map(c => (
            <TouchableOpacity key={c.icon} onPress={c.action || undefined} style={s.contactRow}>
              <Ionicons name={c.icon as any} size={18} color={Colors.accent} />
              <Text style={[Typography.body, { marginLeft: 8 }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </PlatinumCard>

        {/* Reviews */}
        <PlatinumCard>
          <Text style={[Typography.h3, { marginBottom: 12 }]}>Write a Review</Text>
          <View style={s.starRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={28} color={Colors.accent} />
              </TouchableOpacity>
            ))}
          </View>
          <PlatinumInput value={review} onChangeText={setReview} placeholder="Share your experience..." multiline numberOfLines={3} style={{ height: 80, textAlignVertical: 'top' }} />
          <PlatinumButton label="Submit Review" onPress={postReview} loading={posting} />
        </PlatinumCard>

        {biz.reviews?.length > 0 && (
          <View>
            <Text style={[Typography.h3, { marginBottom: 12 }]}>Reviews ({biz.reviews.length})</Text>
            {biz.reviews.map((r: any) => (
              <PlatinumCard key={r.id} style={{ marginBottom: 8 }}>
                <View style={s.reviewRow}>
                  <Text style={Typography.bodySemi}>{r.reviewer_name}</Text>
                  <Text style={{ color: Colors.accent }}>{'⭐'.repeat(r.rating)}</Text>
                </View>
                <Text style={[Typography.body, { marginTop: 4 }]}>{r.comment}</Text>
              </PlatinumCard>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  header: { alignItems: 'center' },
  bizAvatar: { width: 80, height: 80, borderRadius: 20, backgroundColor: Colors.shimmerBase, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
