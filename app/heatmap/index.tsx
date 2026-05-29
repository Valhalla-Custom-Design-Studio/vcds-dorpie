import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { Colors, Typography } from '@/theme';
import { PlatinumCard, ScreenHeader, Badge } from '@/components/ui';
import { heatmapAPI, reportsAPI } from '@/services/api';

const { width } = Dimensions.get('window');

export default function Heatmap() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([heatmapAPI.get(), reportsAPI.list()])
      .then(([h, r]) => {
        if (r.status === 'fulfilled') setData(r.value.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Group by area
  const byArea: Record<string, any[]> = {};
  data.forEach(r => {
    const area = r.address || 'Unknown Area';
    if (!byArea[area]) byArea[area] = [];
    byArea[area].push(r);
  });

  const riskColor = (count: number) =>
    count >= 5 ? Colors.red : count >= 3 ? Colors.warning : Colors.success;

  return (
    <View style={s.container}>
      <ScreenHeader title="Safety Heatmap" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 48 }} />
        ) : (
          <>
            <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: 16 }]}>
              Incident frequency by area in the past 30 days
            </Text>
            <View style={s.legend}>
              {[
                { color: Colors.success, label: 'Low (0–2)' },
                { color: Colors.warning, label: 'Medium (3–4)' },
                { color: Colors.red, label: 'High (5+)' },
              ].map(l => (
                <View key={l.label} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: l.color }]} />
                  <Text style={Typography.caption}>{l.label}</Text>
                </View>
              ))}
            </View>

            {Object.entries(byArea).sort((a, b) => b[1].length - a[1].length).map(([area, incidents]) => (
              <PlatinumCard key={area} style={s.areaCard}>
                <View style={s.areaRow}>
                  <View style={[s.areaDot, { backgroundColor: riskColor(incidents.length) }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={Typography.bodySemi}>{area}</Text>
                    <Text style={Typography.caption}>{incidents.length} incident{incidents.length !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={[s.riskBar, { width: Math.min((incidents.length / 10) * 80, 80), backgroundColor: riskColor(incidents.length) + '80' }]} />
                </View>
              </PlatinumCard>
            ))}

            {Object.keys(byArea).length === 0 && (
              <View style={s.empty}>
                <Text style={{ fontSize: 48 }}>🟢</Text>
                <Text style={[Typography.h3, { marginTop: 12 }]}>All Clear</Text>
                <Text style={[Typography.body, { color: Colors.textMuted, textAlign: 'center' }]}>No incidents reported in your area recently.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 16, paddingBottom: 32 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  areaCard: { marginBottom: 8 },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  areaDot: { width: 12, height: 12, borderRadius: 6 },
  riskBar: { height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', paddingTop: 48 },
});
