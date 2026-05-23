import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../src/theme';
import { PlatinumCard, Badge, ScreenHeader, EmptyState } from '../../src/components/ui';
import { listingsAPI } from '../../src/services/api';

const TYPES = ['All', 'For Sale', 'Wanted', 'Free', 'Rent', 'Services'];

export default function Listings() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { const { data } = await listingsAPI.list(); setItems(data.data || []); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let f = items;
    if (type !== 'All') f = f.filter(i => i.listing_type === type);
    if (search) f = f.filter(i => i.title.toLowerCase().includes(search.toLowerCase()));
    setFiltered(f);
  }, [type, search, items]);

  return (
    <View style={s.container}>
      <ScreenHeader title="Marketplace" showBack right={
        <TouchableOpacity onPress={() => router.push('/listings/create')}><Ionicons name="add-circle" size={28} color={Colors.primary} /></TouchableOpacity>
      } />
      <View style={s.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput style={s.search} placeholder="Search listings..." placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <FlatList horizontal data={TYPES} keyExtractor={i => i} showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.typeBar}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setType(item)} style={[s.typePill, type === item && s.typeActive]}>
                <Text style={[s.typeText, type === item && { color: '#fff' }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        }
        ListEmptyComponent={!loading ? <EmptyState icon="bag-outline" title="No listings yet" actionLabel="Post Listing" onAction={() => router.push('/listings/create')} /> : null}
        numColumns={2}
        columnWrapperStyle={{ gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/listings/${item.id}`)} style={s.gridItem}>
            <PlatinumCard style={s.card}>
              <View style={s.imgPlaceholder}><Text style={{ fontSize: 32 }}>🛍️</Text></View>
              <Badge label={item.listing_type} variant={item.listing_type === 'Free' ? 'success' : 'primary'} />
              <Text style={[Typography.bodySemi, { marginTop: 6 }]} numberOfLines={2}>{item.title}</Text>
              {item.price != null ? <Text style={[Typography.body, { color: Colors.accent, fontWeight: '700', marginTop: 4 }]}>R{Number(item.price).toFixed(2)}</Text> : null}
            </PlatinumCard>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder, borderRadius: 12, marginHorizontal: 16, marginVertical: 8, paddingHorizontal: 12 },
  search: { flex: 1, paddingVertical: 10, color: Colors.textHeading, fontSize: 15 },
  typeBar: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  typePill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  typeActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeText: { color: Colors.textBody, fontSize: 13, fontWeight: '600' },
  gridItem: { flex: 1 },
  card: { padding: 12 },
  imgPlaceholder: { width: '100%', height: 100, backgroundColor: Colors.shimmerBase, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
