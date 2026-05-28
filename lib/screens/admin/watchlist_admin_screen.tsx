import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, ActivityIndicator, RefreshControl,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';

const THREAT_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high:     '#EA580C',
  medium:   '#D97706',
  low:      '#16A34A',
};

const THREAT_LABELS: Record<string, string> = {
  critical: 'KRITIEK',
  high:     'HOOG',
  medium:   'MEDIUM',
  low:      'LAAG',
};

type WatchlistEntry = {
  id: string;
  value: string;
  type: 'plate' | 'face';
  threat: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  added_by: string;
  created_at: string;
  hit_count: number;
  active: boolean;
};

type WatchlistEvent = {
  id: string;
  entry_id: string;
  value: string;
  location: string;
  camera_id: string;
  confidence: number;
  timestamp: string;
  estate_name: string;
};

type Tab = 'plates' | 'faces' | 'events';

import { api } from '../../../src/services/api';

async function apiFetch(path: string, opts?: RequestInit) {
  const method = (opts?.method || 'GET').toLowerCase() as 'get' | 'post' | 'put' | 'delete';
  const body = opts?.body ? JSON.parse(opts.body as string) : undefined;
  const res = await (body ? api[method](path, body) : api[method](path));
  return res.data;
}

export default function WatchlistAdminScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('plates');
  const [plates, setPlates] = useState<WatchlistEntry[]>([]);
  const [faces, setFaces] = useState<WatchlistEntry[]>([]);
  const [events, setEvents] = useState<WatchlistEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'plate' | 'face'>('plate');
  const [addValue, setAddValue] = useState('');
  const [addReason, setAddReason] = useState('');
  const [addThreat, setAddThreat] = useState<'critical'|'high'|'medium'|'low'>('high');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);
      const [platesRes, facesRes, eventsRes] = await Promise.all([
        apiFetch('/api/admin/watchlist?type=plate'),
        apiFetch('/api/admin/watchlist?type=face'),
        apiFetch('/api/admin/watchlist/events?limit=50'),
      ]);
      setPlates(platesRes.data || []);
      setFaces(facesRes.data || []);
      setEvents(eventsRes.data || []);
    } catch (e: any) {
      setError(e.message || 'Kon nie data laai nie');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleAdd = async () => {
    if (!addValue.trim()) { Alert.alert('Fout', 'Voer 'n waarde in'); return; }
    setSaving(true);
    try {
      await apiFetch('/api/admin/watchlist', {
        method: 'POST',
        body: JSON.stringify({ type: addType, value: addValue.trim().toUpperCase(), reason: addReason, threat: addThreat }),
      });
      setShowAddModal(false);
      setAddValue(''); setAddReason(''); setAddThreat('high');
      load();
    } catch (e: any) {
      Alert.alert('Fout', e.message || 'Kon nie byvoeg nie');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (entry: WatchlistEntry) => {
    Alert.alert(
      entry.active ? 'Deaktiveer' : 'Aktiveer',
      `${entry.active ? 'Deaktiveer' : 'Aktiveer'} waglysinskrywing vir ${entry.value}?`,
      [
        { text: 'Kanselleer', style: 'cancel' },
        { text: 'Bevestig', onPress: async () => {
          try {
            await apiFetch(`/api/admin/watchlist/${entry.id}/toggle`, { method: 'PATCH' });
            load();
          } catch (e: any) {
            Alert.alert('Fout', e.message);
          }
        }},
      ]
    );
  };

  const handleDelete = async (entry: WatchlistEntry) => {
    Alert.alert('Verwyder', `Verwyder ${entry.value} van waglys?`, [
      { text: 'Kanselleer', style: 'cancel' },
      { text: 'Verwyder', style: 'destructive', onPress: async () => {
        try {
          await apiFetch(`/api/admin/watchlist/${entry.id}`, { method: 'DELETE' });
          load();
        } catch (e: any) {
          Alert.alert('Fout', e.message);
        }
      }},
    ]);
  };

  const filteredPlates = plates.filter(p => p.value.includes(search.toUpperCase()) || p.reason.toLowerCase().includes(search.toLowerCase()));
  const filteredFaces = faces.filter(f => f.value.toLowerCase().includes(search.toLowerCase()) || f.reason.toLowerCase().includes(search.toLowerCase()));

  const renderEntry = ({ item }: { item: WatchlistEntry }) => (
    <View style={[s.card, !item.active && s.cardInactive]}>
      <View style={s.cardHeader}>
        <View style={[s.threatBadge, { backgroundColor: THREAT_COLORS[item.threat] }]}>
          <Text style={s.threatTxt}>{THREAT_LABELS[item.threat]}</Text>
        </View>
        <Text style={s.hitCount}>🎯 {item.hit_count} treffers</Text>
        {!item.active && <View style={s.inactiveBadge}><Text style={s.inactiveTxt}>INAKTIEF</Text></View>}
      </View>
      <Text style={s.entryValue}>{item.value}</Text>
      <Text style={s.entryReason}>{item.reason}</Text>
      <Text style={s.entryMeta}>Bygevoeg deur {item.added_by} · {new Date(item.created_at).toLocaleDateString('af-ZA')}</Text>
      <View style={s.cardActions}>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: item.active ? '#EA580C22' : '#16A34A22' }]} onPress={() => handleToggle(item)}>
          <Text style={{ color: item.active ? '#EA580C' : '#16A34A', fontWeight: 'bold', fontSize: 12 }}>
            {item.active ? '⏸ Deaktiveer' : '▶ Aktiveer'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#DC262622' }]} onPress={() => handleDelete(item)}>
          <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 12 }}>🗑 Verwyder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEvent = ({ item }: { item: WatchlistEvent }) => (
    <View style={s.eventCard}>
      <View style={s.eventHeader}>
        <Text style={s.eventValue}>🚨 {item.value}</Text>
        <Text style={s.eventConf}>{Math.round(item.confidence * 100)}%</Text>
      </View>
      <Text style={s.eventDetail}>📍 {item.estate_name} · 📷 {item.camera_id}</Text>
      <Text style={s.eventDetail}>🕐 {new Date(item.timestamp).toLocaleString('af-ZA')}</Text>
    </View>
  );

  if (loading) return (
    <View style={s.center}><ActivityIndicator size="large" color="#EF4444" /><Text style={s.loadingTxt}>Laai waglys...</Text></View>
  );

  if (error) return (
    <View style={s.center}>
      <Text style={s.errorTxt}>⚠️ {error}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={load}><Text style={s.retryTxt}>Probeer Weer</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={s.container}>
      {/* Stats Bar */}
      <View style={s.statsBar}>
        <View style={s.statItem}><Text style={s.statNum}>{plates.length}</Text><Text style={s.statLbl}>Plate</Text></View>
        <View style={s.statItem}><Text style={s.statNum}>{faces.length}</Text><Text style={s.statLbl}>Gesigte</Text></View>
        <View style={s.statItem}><Text style={[s.statNum, { color: '#EF4444' }]}>{plates.filter(p => p.threat === 'critical').length + faces.filter(f => f.threat === 'critical').length}</Text><Text style={s.statLbl}>Kritiek</Text></View>
        <View style={s.statItem}><Text style={[s.statNum, { color: '#F59E0B' }]}>{events.length}</Text><Text style={s.statLbl}>Onlangse Treffers</Text></View>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          placeholder="Soek plaat, gesig, rede..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={s.addBtn} onPress={() => { setAddType(activeTab === 'faces' ? 'face' : 'plate'); setShowAddModal(true); }}>
          <Text style={s.addBtnTxt}>+ Voeg By</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(['plates', 'faces', 'events'] as Tab[]).map(tab => (
          <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[s.tabTxt, activeTab === tab && s.tabTxtActive]}>
              {tab === 'plates' ? `🚗 Plate (${plates.length})` : tab === 'faces' ? `👤 Gesigte (${faces.length})` : `🎯 Treffers (${events.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'plates' && (
        <FlatList
          data={filteredPlates}
          keyExtractor={i => i.id}
          renderItem={renderEntry}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EF4444" />}
          ListEmptyComponent={<Text style={s.emptyTxt}>Geen nommer plate op waglys nie</Text>}
        />
      )}
      {activeTab === 'faces' && (
        <FlatList
          data={filteredFaces}
          keyExtractor={i => i.id}
          renderItem={renderEntry}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EF4444" />}
          ListEmptyComponent={<Text style={s.emptyTxt}>Geen gesigte op waglys nie</Text>}
        />
      )}
      {activeTab === 'events' && (
        <FlatList
          data={events}
          keyExtractor={i => i.id}
          renderItem={renderEvent}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EF4444" />}
          ListEmptyComponent={<Text style={s.emptyTxt}>Geen onlangse treffers nie</Text>}
        />
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Voeg {addType === 'plate' ? 'Nommer Plaat' : 'Gesig'} By</Text>
            <View style={s.typeToggle}>
              {(['plate', 'face'] as const).map(t => (
                <TouchableOpacity key={t} style={[s.typeBtn, addType === t && s.typeBtnActive]} onPress={() => setAddType(t)}>
                  <Text style={[s.typeBtnTxt, addType === t && s.typeBtnTxtActive]}>{t === 'plate' ? '🚗 Plaat' : '👤 Gesig'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.input} placeholder={addType === 'plate' ? 'bv. CA 123-456' : 'Naam / beskrywing'} placeholderTextColor="#666" value={addValue} onChangeText={setAddValue} autoCapitalize="characters" />
            <TextInput style={[s.input, { height: 80 }]} placeholder="Rede vir byvoeg..." placeholderTextColor="#666" value={addReason} onChangeText={setAddReason} multiline />
            <Text style={s.modalLabel}>Dreigingsvlak:</Text>
            <View style={s.threatRow}>
              {(['low','medium','high','critical'] as const).map(t => (
                <TouchableOpacity key={t} style={[s.threatBtn, { borderColor: THREAT_COLORS[t] }, addThreat === t && { backgroundColor: THREAT_COLORS[t] }]} onPress={() => setAddThreat(t)}>
                  <Text style={{ color: addThreat === t ? '#fff' : THREAT_COLORS[t], fontSize: 11, fontWeight: 'bold' }}>{THREAT_LABELS[t]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAddModal(false)}><Text style={s.cancelTxt}>Kanselleer</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleAdd} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveTxt}>Voeg By</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D1A' },
  loadingTxt: { color: '#aaa', marginTop: 12 },
  errorTxt: { color: '#EF4444', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  retryTxt: { color: '#fff', fontWeight: 'bold' },
  statsBar: { flexDirection: 'row', backgroundColor: '#1A1A2E', paddingVertical: 14, paddingHorizontal: 20, justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statLbl: { fontSize: 11, color: '#888', marginTop: 2 },
  searchRow: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#12121F' },
  searchInput: { flex: 1, backgroundColor: '#1E1E35', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', fontSize: 14 },
  addBtn: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  tabs: { flexDirection: 'row', backgroundColor: '#12121F', borderBottomWidth: 1, borderBottomColor: '#2a2a40' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#EF4444' },
  tabTxt: { color: '#888', fontSize: 12, fontWeight: '600' },
  tabTxtActive: { color: '#EF4444' },
  card: { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a40' },
  cardInactive: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  threatBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  threatTxt: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  hitCount: { color: '#aaa', fontSize: 12 },
  inactiveBadge: { backgroundColor: '#333', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  inactiveTxt: { color: '#888', fontSize: 10, fontWeight: 'bold' },
  entryValue: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  entryReason: { fontSize: 13, color: '#bbb', marginBottom: 4 },
  entryMeta: { fontSize: 11, color: '#666', marginBottom: 12 },
  cardActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  eventCard: { backgroundColor: '#1A1A2E', borderRadius: 10, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#EF4444' },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  eventValue: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  eventConf: { color: '#22C55E', fontWeight: 'bold', fontSize: 13 },
  eventDetail: { fontSize: 12, color: '#aaa', marginBottom: 2 },
  emptyTxt: { textAlign: 'center', color: '#555', fontSize: 14, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1A1A2E', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  modalLabel: { color: '#aaa', fontSize: 13, marginTop: 12, marginBottom: 8 },
  typeToggle: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typeBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#12121F', borderWidth: 1, borderColor: '#333' },
  typeBtnActive: { backgroundColor: '#EF444422', borderColor: '#EF4444' },
  typeBtnTxt: { color: '#888', fontWeight: '600' },
  typeBtnTxtActive: { color: '#EF4444' },
  input: { backgroundColor: '#12121F', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a40' },
  threatRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  threatBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', borderWidth: 1, backgroundColor: 'transparent' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#12121F', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelTxt: { color: '#aaa', fontWeight: 'bold' },
  saveBtn: { flex: 1, backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveTxt: { color: '#fff', fontWeight: 'bold' },
});
