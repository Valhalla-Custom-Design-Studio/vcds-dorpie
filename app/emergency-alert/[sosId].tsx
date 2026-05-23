import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../src/theme';
import { PlatinumCard, ScreenHeader, Badge } from '../../src/components/ui';
import { emergencyAlertsAPI } from '../../src/services/api';

export default function EmergencyAlertDetail() {
  const { sosId } = useLocalSearchParams<{ sosId: string }>();
  const insets = useSafeAreaInsets();
  const [alert, setAlert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    emergencyAlertsAPI.get(sosId!).then(r => setAlert(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [sosId]);

  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScreenHeader title="Emergency Alert" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <PlatinumCard style={{ borderColor: Colors.red, borderWidth: 2 }}>
          <View style={s.row}>
            <Ionicons name="alert-circle" size={32} color={Colors.red} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[Typography.h2, { color: Colors.red }]}>{alert?.title || 'Emergency Alert'}</Text>
              <Badge label={alert?.severity || 'HIGH'} variant="error" />
            </View>
          </View>
          <Text style={[Typography.body, { lineHeight: 24, marginTop: 12 }]}>{alert?.description || 'An emergency alert has been triggered in your area. Stay vigilant.'}</Text>
          <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 12 }]}>
            {alert ? new Date(alert.created_at).toLocaleString('en-ZA') : ''}
          </Text>
          {alert?.reporter_name && <Text style={[Typography.caption, { color: Colors.textMuted }]}>Reported by {alert.reporter_name}</Text>}
        </PlatinumCard>
        <PlatinumCard>
          <Text style={Typography.h3}>Safety Instructions</Text>
          {['Stay indoors if possible', 'Lock your doors and windows', 'Call SAPS: 10111 for emergencies', 'Monitor Dorpwag™ for updates', 'Do not confront suspects'].map(tip => (
            <View key={tip} style={s.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={[Typography.body, { marginLeft: 8 }]}>{tip}</Text>
            </View>
          ))}
        </PlatinumCard>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
});
