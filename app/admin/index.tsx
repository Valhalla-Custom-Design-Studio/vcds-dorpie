import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../src/theme';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth';
import { useRouter } from 'expo-router';

export default function AdminScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user?.role !== 'admin') { router.replace('/(tabs)'); return; }
    api.get('/admin/stats').then(r => setStats(r.data.data)).catch(() => {});
  }, []);

  if (user?.role !== 'admin') return null;

  const navItems = [
    { label: 'Bestuur Gebruikers', route: '/admin/users', icon: '👥' },
    { label: 'Verslae', route: '/admin/reports', icon: '📊' },
    { label: 'Waglyslys', route: '/admin/watchlist', icon: '🚨', highlight: true },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Admin Paneel</Text>
      {stats && (
        <View style={s.grid}>
          {Object.entries(stats).map(([k, v]) => (
            <View key={k} style={s.stat}>
              <Text style={s.statVal}>{String(v)}</Text>
              <Text style={s.statKey}>{k.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      )}
      {navItems.map(item => (
        <TouchableOpacity
          key={item.route}
          style={[s.btn, item.highlight && s.btnHighlight]}
          onPress={() => router.push(item.route as any)}
        >
          <Text style={s.btnIcon}>{item.icon}</Text>
          <Text style={[s.btnText, item.highlight && s.btnTextHighlight]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  stat: { backgroundColor: Colors.card, borderRadius: 12, padding: 16, width: '47%', alignItems: 'center' },
  statVal: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  statKey: { fontSize: 12, color: Colors.muted, textTransform: 'capitalize', textAlign: 'center', marginTop: 4 },
  btn: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    flexDirection: 'row',
    gap: 10,
  },
  btnHighlight: {
    backgroundColor: '#1a0000',
    borderColor: '#ff3b30',
  },
  btnIcon: { fontSize: 20 },
  btnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  btnTextHighlight: { color: '#ff3b30' },
});
