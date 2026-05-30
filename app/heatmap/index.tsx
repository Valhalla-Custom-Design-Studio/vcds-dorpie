import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius } from '@/theme';
import { PlatinumCard, ScreenHeader, Badge, SectionHeader } from '@/components/ui';
import { heatmapAPI, reportsAPI } from '@/services/api';

const RISK_COLOR = (count: number) =>
  count >= 5 ? Colors.accentRed : count >= 3 ? Colors.accentOrange : count >= 1 ? Colors.accentYellow : Colors.accentGreen;

const RISK_LABEL = (count: number) =>
  count >= 5 ? 'HOOG' : count >= 3 ? 'MEDIUM' : count >= 1 ? 'LAAG' : 'VEILIG';

export default function Heatmap() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([heatmapAPI.get(), reportsAPI.list()])
      .then(([, r]) => {
        if (r.status === 'fulfilled') setData(r.value.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const byArea: Record<string, any[]> = {};
  data.forEach(r => {
    const area = r.address || r.area || 'Onbekende Area';
    if (!byArea[area]) byArea[area] = [];
    byArea[area].push(r);
  });

  const sorted = Object.entries(byArea).sort((a, b) => b[1].length - a[1].length);

  return (
    <View style={s.container}>
      <ScreenHeader title="Veiligheids Hittemap" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 48 }} />
        ) : (
          <>
            {/* Legend */}
            <PlatinumCard style={s.legend}>
              <Text style={[Typography.label, { marginBottom: 10 }]}>RISIKO VLAKKE</Text>
              <View style={s.legendRow}>
                {[
                  { color: Colors.accentGreen, label: 'Veilig (0)' },
                  { color: Colors.accentYellow, label: 'Laag (1–2)' },
                  { color: Colors.accentOrange, label: 'Medium (3–4)' },
                  { color: Colors.accentRed, label: 'Hoog (5+)' },
                ].map(l => (
                  <View key={l.label} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: l.color }]} />
                    <Text style={Typography.caption}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </PlatinumCard>

            <SectionHeader title={`${sorted.length} Areas Gemonitor`} />

            {sorted.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="map-outline" size={48} color={Colors.textMuted} />
                <Text style={[Typography.body, { color: Colors.textMuted, marginTop: 12 }]}>Geen data beskikbaar nie</Text>
              </View>
            ) : (
              sorted.map(([area, incidents]) => {
                const count = incidents.length;
                const color = RISK_COLOR(count);
                return (
                  <PlatinumCard key={area} accentColor={color} style={s.areaCard}>
                    <View style={s.areaRow}>
                      <View style={[s.areaBar, { backgroundColor: color + '30', borderColor: color + '60' }]}>
                        <View style={[s.areaFill, { backgroundColor: color, width: `${Math.min(count * 20, 100)}%` as any }]} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={Typography.bodySemi} numberOfLines={1}>{area}</Text>
                        <Text style={Typography.caption}>{count} voorval{count !== 1 ? 'le' : ''}</Text>
                      </View>
                      <Badge label={RISK_LABEL(count)} color={color} />
                    </View>
                  </PlatinumCard>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  legend: { marginBottom: 16 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  areaCard: { marginBottom: 8 },
  areaRow: { flexDirection: 'row', alignItems: 'center' },
  areaBar: { width: 60, height: 8, borderRadius: 4, borderWidth: 1, overflow: 'hidden' },
  areaFill: { height: '100%', borderRadius: 4 },
  empty: { alignItems: 'center', paddingTop: 60 },
});
