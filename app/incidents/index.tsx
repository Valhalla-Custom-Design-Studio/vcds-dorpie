import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/theme';
import { PlatinumCard, Badge, ScreenHeader, EmptyState, FilterPill } from '@/components/ui';
import { reportsAPI } from '@/services/api';
import { t } from '@/i18n';

const SEVERITY_COLOR: Record<string, string> = {
  high: Colors.accentRed,
  medium: Colors.accentYellow,
  low: Colors.accentGreen,
};

const CATS = [
  { key: 'all', apiVal: undefined },
  { key: 'theft', apiVal: 'Theft' },
  { key: 'breakIn', apiVal: 'Break-in' },
  { key: 'vandalism', apiVal: 'Vandalism' },
  { key: 'suspicious', apiVal: 'Suspicious' },
  { key: 'assault', apiVal: 'Assault' },
  { key: 'other', apiVal: 'Other' },
];

export default function Incidents() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [catKey, setCatKey] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const activeCat = CATS.find(c => c.key === catKey) || CATS[0];

  const load = async () => {
    try {
      const { data } = await reportsAPI.list({ category: activeCat.apiVal });
      setReports(data.data || []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [catKey]);

  return (
    <View style={s.container}>
      <ScreenHeader
        title={t('incidents.title')}
        showBack
        right={
          <TouchableOpacity onPress={() => router.push('/incidents/create')}>
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={reports}
        keyExtractor={i => i.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <FlatList
            horizontal
            data={CATS}
            keyExtractor={i => i.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.pillBar}
            renderItem={({ item }) => (
              <FilterPill
                label={t(`incidents.categories.${item.key}`)}
                active={catKey === item.key}
                onPress={() => setCatKey(item.key)}
              />
            )}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="shield-outline"
              title={t('incidents.noIncidents')}
              subtitle={t('incidents.noIncidentsDesc')}
              actionLabel={t('incidents.create')}
              onAction={() => router.push('/incidents/create')}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/incidents/${item.id}` as any)}>
            <PlatinumCard
              accentColor={SEVERITY_COLOR[item.severity] || Colors.textMuted}
              style={s.card}
            >
              <View style={s.row}>
                <View style={[s.dot, { backgroundColor: SEVERITY_COLOR[item.severity] || Colors.textMuted }]} />
                <View style={{ flex: 1 }}>
                  <Text style={Typography.bodySemi} numberOfLines={1}>{item.title || item.type}</Text>
                  <Text style={[Typography.caption, { color: Colors.textMuted }]} numberOfLines={1}>
                    {item.address || item.location || t('common.unknown')}
                  </Text>
                </View>
                <Badge
                  label={item.severity?.toUpperCase() || '—'}
                  color={SEVERITY_COLOR[item.severity] || Colors.textMuted}
                />
              </View>
            </PlatinumCard>
          </TouchableOpacity>
        )}
        contentContainerStyle={s.list}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  pillBar: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
