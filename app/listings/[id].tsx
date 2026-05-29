import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../src/theme';
import { PlatinumCard, PlatinumButton, ScreenHeader, Badge } from '../../src/components/ui';
import { listingsAPI } from '../../src/services/api';

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    listingsAPI.get(id!).then(r => setItem(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const contact = async () => {
    setContacting(true);
    try { await listingsAPI.contact(id!); Alert.alert('Contacted!', 'The seller will be notified of your interest.'); }
    catch { Alert.alert('Failed to contact seller'); }
    finally { setContacting(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (!item) return <View style={s.center}><Text style={Typography.body}>Listing not found</Text></View>;

  return (
    <View style={s.container}>
      <ScreenHeader title="Listing" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.imgBox}><Text style={{ fontSize: 64 }}>🛍️</Text></View>
        <PlatinumCard>
          <View style={s.row}><Badge label={item.listing_type} variant={item.listing_type === 'Free' ? 'success' : 'primary'} />
            {item.price != null ? <Text style={[Typography.h2, { color: Colors.accent }]}>R{Number(item.price).toFixed(2)}</Text> : null}
          </View>
          <Text style={[Typography.h2, { marginTop: 8 }]}>{item.title}</Text>
          <Text style={[Typography.body, { lineHeight: 24, marginTop: 8 }]}>{item.description}</Text>
          <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 12 }]}>
            Listed by {item.seller_name || 'Community Member'} · {new Date(item.created_at).toLocaleDateString('en-ZA')}
          </Text>
        </PlatinumCard>
        <PlatinumButton label="Contact Seller" onPress={contact} loading={contacting} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  imgBox: { width: '100%', height: 200, backgroundColor: Colors.shimmerBase, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
