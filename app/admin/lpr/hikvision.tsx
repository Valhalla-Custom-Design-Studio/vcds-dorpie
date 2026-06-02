import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { PlatinumCard, ScreenHeader, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

interface Camera {
  id: string;
  name: string;
  ip: string;
  port: number;
  username: string;
  location: string;
  is_online: boolean;
  last_seen: string | null;
  source: 'hikvision' | 'snipr' | 'manual';
}

interface LPREvent {
  id: string;
  plate: string;
  confidence: number;
  source: string;
  location: string;
  is_watchlisted: boolean;
  watchlist_reason?: string;
  timestamp: string;
  camera_id?: string;
}

type Tab = 'cameras' | 'events' | 'add';

export default function HikvisionAdminScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [tab, setTab] = useState<Tab>('cameras');
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [events, setEvents] = useState<LPREvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add camera form
  const [form, setForm] = useState({
    name: '', ip: '', port: '80', username: '', password: '', location: '',
  });
  const [adding, setAdding] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchCameras = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/lpr/hikvision/cameras`, { headers });
      if (res.ok) setCameras(await res.json());
    } catch {}
  }, [token]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/lpr/feed?limit=100`, { headers });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.entries ?? []);
      }
    } catch {}
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCameras(), fetchEvents()]);
    setLoading(false);
  }, [fetchCameras, fetchEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchCameras(), fetchEvents()]);
    setRefreshing(false);
  }, [fetchCameras, fetchEvents]);

  useEffect(() => { load(); }, []);

  const addCamera = async () => {
    if (!form.name || !form.ip) {
      Alert.alert('Vereiste velde', 'Naam en IP-adres is verpligtend.');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/api/lpr/hikvision/cameras`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: form.name,
          ip: form.ip,
          port: parseInt(form.port) || 80,
          username: form.username,
          password: form.password,
          location: form.location,
        }),
      });
      if (res.ok) {
        Alert.alert('✅ Kamera bygevoeg', `${form.name} is suksesvol gekoppel.`);
        setForm({ name: '', ip: '', port: '80', username: '', password: '', location: '' });
        setTab('cameras');
        await fetchCameras();
      } else {
        Alert.alert('Fout', 'Kon nie kamera byvoeg nie.');
      }
    } catch {
      Alert.alert('Netwerkfout', 'Probeer weer.');
    } finally {
      setAdding(false);
    }
  };

  const testCamera = async (cam: Camera) => {
    Alert.alert(
      'Kamera toets',
      `Toets verbinding na ${cam.name} (${cam.ip}:${cam.port})...`,
      [
        { text: 'Kanselleer', style: 'cancel' },
        {
          text: 'Toets',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/api/lpr/hikvision/test/${cam.id}`, { headers });
              const data = await res.json();
              Alert.alert(
                data.online ? '✅ Aanlyn' : '❌ Vanlyn',
                data.online
                  ? `Kamera reageer. Firmware: ${data.firmware ?? 'onbekend'}`
                  : `Kon nie verbind nie: ${data.error ?? 'tyduit'}`
              );
            } catch {
              Alert.alert('❌ Vanlyn', 'Geen reaksie van kamera nie.');
            }
          },
        },
      ]
    );
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString('af-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <ScreenHeader title="Hikvision LPR" onBack={() => router.back()} />

      {/* Tab bar */}
      <View style={s.tabBar}>
        {(['cameras', 'events', 'add'] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Ionicons
              name={t === 'cameras' ? 'videocam' : t === 'events' ? 'list' : 'add-circle'}
              size={16}
              color={tab === t ? Colors.accent : Colors.textMuted}
            />
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'cameras' ? `Kameras (${cameras.length})` : t === 'events' ? `Gebeure (${events.length})` : 'Voeg by'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {/* CAMERAS TAB */}
        {tab === 'cameras' && (
          <>
            {cameras.length === 0 ? (
              <PlatinumCard style={s.emptyCard}>
                <Ionicons name="videocam-off" size={40} color={Colors.textMuted} />
                <Text style={s.emptyText}>Geen kameras gekoppel nie</Text>
                <Text style={s.emptySubText}>Voeg jou eerste Hikvision kamera by</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => setTab('add')}>
                  <Text style={s.emptyBtnText}>+ Voeg kamera by</Text>
                </TouchableOpacity>
              </PlatinumCard>
            ) : (
              cameras.map(cam => (
                <PlatinumCard key={cam.id} style={s.cameraCard}>
                  <View style={s.cameraHeader}>
                    <View style={s.cameraInfo}>
                      <View style={[s.statusDot, { backgroundColor: cam.is_online ? '#22C55E' : '#EF4444' }]} />
                      <Text style={s.cameraName}>{cam.name}</Text>
                    </View>
                    <Badge
                      label={cam.is_online ? 'Aanlyn' : 'Vanlyn'}
                      color={cam.is_online ? '#22C55E' : '#EF4444'}
                    />
                  </View>
                  <Text style={s.cameraDetail}>📍 {cam.location || 'Geen ligging'}</Text>
                  <Text style={s.cameraDetail}>🌐 {cam.ip}:{cam.port}</Text>
                  {cam.last_seen && (
                    <Text style={s.cameraDetail}>🕐 Laas gesien: {formatTime(cam.last_seen)}</Text>
                  )}
                  <TouchableOpacity style={s.testBtn} onPress={() => testCamera(cam)}>
                    <Ionicons name="wifi" size={14} color={Colors.accent} />
                    <Text style={s.testBtnText}>Toets verbinding</Text>
                  </TouchableOpacity>
                </PlatinumCard>
              ))
            )}
          </>
        )}

        {/* EVENTS TAB */}
        {tab === 'events' && (
          <>
            {events.length === 0 ? (
              <PlatinumCard style={s.emptyCard}>
                <Ionicons name="car-outline" size={40} color={Colors.textMuted} />
                <Text style={s.emptyText}>Geen LPR gebeure nie</Text>
                <Text style={s.emptySubText}>Gebeure verskyn hier sodra kameras skandeer</Text>
              </PlatinumCard>
            ) : (
              events.map(ev => (
                <PlatinumCard
                  key={ev.id}
                  style={[s.eventCard, ev.is_watchlisted && s.eventCardAlert]}
                >
                  <View style={s.eventHeader}>
                    <View style={s.plateBox}>
                      <Text style={s.plateText}>{ev.plate}</Text>
                    </View>
                    {ev.is_watchlisted && (
                      <View style={s.alertBadge}>
                        <Ionicons name="warning" size={12} color="#EF4444" />
                        <Text style={s.alertBadgeText}>WAGLYS</Text>
                      </View>
                    )}
                    <Text style={s.confidence}>{Math.round(ev.confidence ?? 0)}%</Text>
                  </View>
                  {ev.is_watchlisted && ev.watchlist_reason && (
                    <Text style={s.watchlistReason}>⚠️ {ev.watchlist_reason}</Text>
                  )}
                  <View style={s.eventMeta}>
                    <Text style={s.eventMetaText}>📍 {ev.location || '—'}</Text>
                    <Text style={s.eventMetaText}>🕐 {formatTime(ev.timestamp)}</Text>
                    <Text style={s.eventMetaText}>
                      {ev.source === 'hikvision' ? '📷 Hikvision' : ev.source === 'snipr' ? '📱 Snipr' : '✋ Handmatig'}
                    </Text>
                  </View>
                </PlatinumCard>
              ))
            )}
          </>
        )}

        {/* ADD CAMERA TAB */}
        {tab === 'add' && (
          <PlatinumCard style={s.formCard}>
            <Text style={s.formTitle}>Nuwe Hikvision Kamera</Text>
            <Text style={s.formSubtitle}>
              Voer die kamera se ISAPI besonderhede in. Die kamera moet op dieselfde netwerk of via port-forwarding bereikbaar wees.
            </Text>

            {[
              { key: 'name', label: 'Kamera naam *', placeholder: 'bv. Hoofingang', icon: 'videocam' },
              { key: 'ip', label: 'IP-adres *', placeholder: 'bv. 192.168.1.64', icon: 'globe', keyboard: 'numeric' },
              { key: 'port', label: 'Poort', placeholder: '80', icon: 'git-network', keyboard: 'numeric' },
              { key: 'username', label: 'Gebruikersnaam', placeholder: 'admin', icon: 'person' },
              { key: 'password', label: 'Wagwoord', placeholder: '••••••••', icon: 'lock-closed', secure: true },
              { key: 'location', label: 'Ligging beskrywing', placeholder: 'bv. Hoofingang Noord', icon: 'location' },
            ].map(field => (
              <View key={field.key} style={s.inputGroup}>
                <Text style={s.inputLabel}>{field.label}</Text>
                <View style={s.inputRow}>
                  <Ionicons name={field.icon as any} size={16} color={Colors.textMuted} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    value={(form as any)[field.key]}
                    onChangeText={v => setForm(prev => ({ ...prev, [field.key]: v }))}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={field.secure}
                    keyboardType={(field.keyboard as any) ?? 'default'}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ))}

            <View style={s.infoBox}>
              <Ionicons name="information-circle" size={16} color={Colors.accent} />
              <Text style={s.infoText}>
                Hikvision ISAPI gebruik HTTP Digest-verifikasie op poort 80 (of 443 vir HTTPS). Maak seker die kamera se LPR-funksie is geaktiveer in die kamera se webkoppelvlak.
              </Text>
            </View>

            <TouchableOpacity style={s.addBtn} onPress={addCamera} disabled={adding}>
              {adding ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={18} color="#000" />
                  <Text style={s.addBtnText}>Voeg kamera by</Text>
                </>
              )}
            </TouchableOpacity>
          </PlatinumCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  tabBar: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.accent + '22', borderColor: Colors.accent },
  tabText: { fontSize: 11, color: Colors.textMuted, fontFamily: Typography.mono },
  tabTextActive: { color: Colors.accent, fontWeight: '600' },
  emptyCard: { alignItems: 'center', padding: Spacing.xl, gap: 8 },
  emptyText: { fontSize: 16, color: Colors.text, fontWeight: '600', marginTop: 8 },
  emptySubText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  emptyBtn: { marginTop: 12, backgroundColor: Colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.md },
  emptyBtnText: { color: '#0A0A0A', fontWeight: '700', fontSize: 14 },
  cameraCard: { marginBottom: Spacing.sm },
  cameraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cameraInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cameraName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cameraDetail: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  testBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'flex-start', backgroundColor: Colors.accent + '18', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm },
  testBtnText: { fontSize: 12, color: Colors.accent, fontWeight: '600' },
  eventCard: { marginBottom: Spacing.sm },
  eventCardAlert: { borderColor: '#EF4444', borderWidth: 1 },
  eventHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  plateBox: { backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: Colors.accent, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  plateText: { fontSize: 18, fontWeight: '900', color: Colors.accent, letterSpacing: 3, fontFamily: Typography.mono },
  alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EF444422', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  alertBadgeText: { fontSize: 10, color: '#EF4444', fontWeight: '800' },
  confidence: { marginLeft: 'auto', fontSize: 12, color: Colors.textMuted },
  watchlistReason: { fontSize: 12, color: '#EF4444', marginBottom: 6 },
  eventMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eventMetaText: { fontSize: 11, color: Colors.textMuted },
  formCard: { padding: Spacing.lg },
  formTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  formSubtitle: { fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 18 },
  inputGroup: { marginBottom: Spacing.sm },
  inputLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 44, color: Colors.text, fontSize: 14 },
  infoBox: { flexDirection: 'row', gap: 8, backgroundColor: Colors.accent + '11', borderRadius: Radius.md, padding: 12, marginVertical: Spacing.md },
  infoText: { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.accent, borderRadius: Radius.md, paddingVertical: 14 },
  addBtnText: { fontSize: 15, fontWeight: '700', color: '#0A0A0A' },
});
