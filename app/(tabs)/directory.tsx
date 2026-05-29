import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/theme';
import { PlatinumCard, Badge } from '@/components/ui';
import { businessesAPI } from '@/services/api';

const CATEGORIES = ['All', 'Food', 'Services', 'Health', 'Retail', 'Auto', 'Legal', 'Other'];

export default function Directory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data } = await businessesAPI.list();
      setBusinesses(data.data || []);
      setFiltered(data.data || []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let f = businesses;
    if (category !== 'All') f = f.filter(b => b.category === category);
    if (search) f = f.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.description?.toLowerCase().includes(search.toLowerCase()));
    setFiltered(f);
  }, [search, category, businesses]);

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  return (
    <View style={[s.container, { paddingTop: insets.top + 16 }]}>
      <View style={s.topBar}>
        <Text style={Typography.h1}>🏪 Directory</Text>
        <TouchableOpacity onPress={() => router.push('/businesses/create')} style={s.addBtn}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={s.searchIcon} />
        <TextInput style={s.search} placeholder="Search businesses..." placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch} />
      </View>
      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cats} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[s.catPill, category === c && s.catActive]}>
            <Text style={[s.catText, category === c && { color: '#fff' }]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {filtered.length === 0 && <View style={s.empty}><Text style={Typography.body}>No businesses found</Text></View>}
        {filtered.map((b: any) => (
          <TouchableOpacity key={b.id} onPress={() => router.push(`/businesses/${b.id}`)}>
            <PlatinumCard>
              <View style={s.bizRow}>
                <View style={s.bizAvatar}><Text style={{ fontSize: 24 }}>🏪</Text></View>
                <View style={s.bizInfo}>
                  <Text style={Typography.bodySemi}>{b.name}</Text>
                  <Text style={Typography.caption} numberOfLines={1}>{b.description}</Text>
                  <View style={s.metaRow}>
                    {b.category ? <Badge label={b.category} variant="primary" /> : null}
                    {b.avg_rating ? <Text style={[Typography.caption, { color: Colors.accent }]}>⭐ {Number(b.avg_rating).toFixed(1)}</Text> : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            </PlatinumCard>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  addBtn: { backgroundColor: Colors.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder, borderRadius: 12, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  search: { flex: 1, paddingVertical: 12, color: Colors.textHeading, fontSize: 15 },
  cats: { marginBottom: 12 },
  catPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  catActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { color: Colors.textBody, fontSize: 13, fontWeight: '600' },
  bizRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bizAvatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.shimmerBase, alignItems: 'center', justifyContent: 'center' },
  bizInfo: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 48 },
});
