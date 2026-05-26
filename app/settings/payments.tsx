import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing } from '../../../src/theme';
import { ScreenHeader, PlatinumCard, EmptyState, Badge } from '../../../src/components/ui';
import { subscriptionsAPI } from '../../../src/services/api';

export default function PaymentHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionsAPI.history()
      .then(r => setHistory(r.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={s.container}>
      <ScreenHeader title="Betalingsgeskiedenis" showBack />
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={<EmptyState icon="receipt-outline" title="Geen betalings nie" subtitle="Jou betalingsgeskiedenis sal hier verskyn" />}
          renderItem={({ item }) => (
            <PlatinumCard>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={Typography.h4}>{item.tier_name || item.description}</Text>
                  <Text style={Typography.caption}>{new Date(item.created_at).toLocaleDateString('af-ZA')}</Text>
                </View>
                <View style={s.right}>
                  <Text style={[Typography.h4, { color: Colors.accent }]}>R{item.amount}</Text>
                  <Badge label={item.status || 'success'} variant={item.status === 'success' ? 'success' : 'muted'} />
                </View>
              </View>
            </PlatinumCard>
          )}
        />
      )}
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: Spacing.md, gap: 8, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  right: { alignItems: 'flex-end', gap: 4 },
});
