import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/theme';
import { useAuthStore } from '@/store/auth';
import { posthog } from '@/lib/posthog';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

interface PlateEntry {
  id: string;
  plate: string;
  timestamp: string;
  cameraId: string;
  cameraName: string;
  location: string;
  flagged: boolean;
  flagReason?: string;
  imageUrl?: string;
  confidence: number;
}

interface WatchlistPlate {
  plate: string;
  reason: string;
  addedAt: string;
  addedBy: string;
}

type ActiveTab = 'live' | 'watchlist' | 'report';

export default function LPRScreen() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('live');
  const [entries, setEntries] = useState<PlateEntry[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistPlate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchPlate, setSearchPlate] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchLiveFeed = async () => {
    try {
      const res = await fetch(`${API_URL}/api/lpr/feed?limit=50`, { headers });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch (e) {
      console.error('LPR feed error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchWatchlist = async () => {
    try {
      const res = await fetch(`${API_URL}/api/lpr/watchlist`, { headers });
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data.plates ?? []);
      }
    } catch (e) {
      console.error('Watchlist error:', e);
    }
  };

  useEffect(() => {
    posthog.capture('lpr_screen_viewed');
    fetchLiveFeed();
    fetchWatchlist();
    // Poll every 15s for live feed
    pollRef.current = setInterval(fetchLiveFeed, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveFeed();
    fetchWatchlist();
  };

  const addToWatchlist = async () => {
    if (!newPlate.trim() || !newReason.trim()) {
      Alert.alert('Required', 'Please enter plate number and reason.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/lpr/watchlist`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ plate: newPlate.trim().toUpperCase(), reason: newReason.trim() }),
      });
      if (res.ok) {
        Alert.alert('Added', `Plate ${newPlate.toUpperCase()} added to watchlist.`);
        setNewPlate('');
        setNewReason('');
        fetchWatchlist();
        posthog.capture('lpr_watchlist_add', { plate: newPlate });
      } else {
        Alert.alert('Error', 'Failed to add plate. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reportPlate = async (plate: string) => {
    try {
      await fetch(`${API_URL}/api/lpr/report`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ plate, reportedBy: user?.id }),
      });
      Alert.alert('Reported', `Plate ${plate} has been flagged and reported to the community.`);
      posthog.capture('lpr_plate_reported', { plate });
    } catch (e) {
      Alert.alert('Error', 'Failed to report plate.');
    }
  };

  const filteredEntries = searchPlate.trim()
    ? entries.filter((e) => e.plate.includes(searchPlate.trim().toUpperCase()))
    : entries;

  const flaggedCount = entries.filter((e) => e.flagged).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="car-sport" size={20} color={Colors.accent} />
          <Text style={styles.headerText}>Plate Recognition</Text>
        </View>
        <View style={styles.flagBadge}>
          <Text style={styles.flagBadgeText}>{flaggedCount}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          { key: 'live', label: 'Live Feed', icon: 'radio' },
          { key: 'watchlist', label: 'Watchlist', icon: 'eye' },
          { key: 'report', label: 'Add Plate', icon: 'add-circle' },
        ] as { key: ActiveTab; label: string; icon: string }[]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons name={tab.icon as any} size={14} color={activeTab === tab.key ? '#000' : Colors.muted} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.loadingText}>Loading plate data...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        >
          {/* Live Feed Tab */}
          {activeTab === 'live' && (
            <>
              <View style={styles.searchRow}>
                <Ionicons name="search" size={16} color={Colors.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search plate..."
                  placeholderTextColor={Colors.muted}
                  value={searchPlate}
                  onChangeText={(t) => setSearchPlate(t.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE — refreshing every 15s</Text>
              </View>
              {filteredEntries.map((entry) => (
                <View key={entry.id} style={[styles.plateCard, entry.flagged && styles.flaggedCard]}>
                  <View style={styles.plateRow}>
                    <View style={styles.plateBadge}>
                      <Text style={styles.plateNumber}>{entry.plate}</Text>
                    </View>
                    {entry.flagged && (
                      <View style={styles.flagTag}>
                        <Ionicons name="warning" size={12} color="#ef4444" />
                        <Text style={styles.flagTagText}>FLAGGED</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.reportBtn} onPress={() => reportPlate(entry.plate)}>
                      <Ionicons name="flag-outline" size={14} color={Colors.muted} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.plateInfo}>
                    <Text style={styles.infoText}>{entry.cameraName} · {entry.location}</Text>
                    <Text style={styles.infoText}>{new Date(entry.timestamp).toLocaleTimeString()} · {entry.confidence}% confidence</Text>
                  </View>
                  {entry.flagReason && (
                    <Text style={styles.flagReason}>⚠ {entry.flagReason}</Text>
                  )}
                </View>
              ))}
              {filteredEntries.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="car-outline" size={48} color={Colors.muted} />
                  <Text style={styles.emptyText}>No plates detected</Text>
                </View>
              )}
            </>
          )}

          {/* Watchlist Tab */}
          {activeTab === 'watchlist' && (
            <>
              <Text style={styles.sectionTitle}>{watchlist.length} plates on watchlist</Text>
              {watchlist.map((plate, i) => (
                <View key={i} style={[styles.plateCard, styles.watchCard]}>
                  <View style={styles.plateRow}>
                    <View style={[styles.plateBadge, { backgroundColor: '#ef4444' + '20' }]}>
                      <Text style={[styles.plateNumber, { color: '#ef4444' }]}>{plate.plate}</Text>
                    </View>
                  </View>
                  <Text style={styles.infoText}>Reason: {plate.reason}</Text>
                  <Text style={styles.infoText}>Added by {plate.addedBy} on {new Date(plate.addedAt).toLocaleDateString()}</Text>
                </View>
              ))}
              {watchlist.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="eye-off-outline" size={48} color={Colors.muted} />
                  <Text style={styles.emptyText}>No plates on watchlist</Text>
                </View>
              )}
            </>
          )}

          {/* Add Plate Tab */}
          {activeTab === 'report' && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Add Suspicious Plate</Text>
              <Text style={styles.formSubtitle}>
                Report a plate to the community watchlist. Visible to all verified Dorpwag™ members in your area.
              </Text>
              <Text style={styles.fieldLabel}>Plate Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. CA 123 456"
                placeholderTextColor={Colors.muted}
                value={newPlate}
                onChangeText={(t) => setNewPlate(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={10}
              />
              <Text style={styles.fieldLabel}>Reason for flagging *</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Describe why this plate is suspicious..."
                placeholderTextColor={Colors.muted}
                value={newReason}
                onChangeText={setNewReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitDisabled]}
                onPress={addToWatchlist}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={18} color="#000" />
                    <Text style={styles.submitText}>Add to Watchlist</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: Colors.muted, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { color: Colors.text, fontSize: 17, fontWeight: '700' },
  flagBadge: { backgroundColor: '#ef4444', borderRadius: 12, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  flagBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.card, borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  activeTab: { backgroundColor: Colors.accent },
  tabText: { color: Colors.muted, fontSize: 11, fontWeight: '600' },
  activeTabText: { color: '#000' },
  scroll: { flex: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginBottom: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  liveText: { color: '#22c55e', fontSize: 11, fontWeight: '600' },
  plateCard: { marginHorizontal: 16, marginBottom: 10, padding: 14, backgroundColor: Colors.card, borderRadius: 12 },
  flaggedCard: { borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  watchCard: { borderLeftWidth: 3, borderLeftColor: '#f97316' },
  plateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  plateBadge: { backgroundColor: Colors.accent + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  plateNumber: { color: Colors.accent, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  flagTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ef4444' + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  flagTagText: { color: '#ef4444', fontSize: 10, fontWeight: '700' },
  reportBtn: { marginLeft: 'auto' as any },
  plateInfo: { gap: 2 },
  infoText: { color: Colors.muted, fontSize: 12 },
  flagReason: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: Colors.muted, fontSize: 13, marginHorizontal: 16, marginBottom: 8 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { color: Colors.muted, fontSize: 14 },
  form: { margin: 16 },
  formTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  formSubtitle: { color: Colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 20 },
  fieldLabel: { color: Colors.text, fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: Colors.card, color: Colors.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  textarea: { height: 100, paddingTop: 12 },
  submitBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#000', fontSize: 15, fontWeight: '700' },
});
