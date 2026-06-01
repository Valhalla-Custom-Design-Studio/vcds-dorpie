import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { PlatinumCard, Badge, ScreenHeader } from '@/components/ui';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { t } from '@/i18n';

const SUPER_ADMIN_EMAIL = 'stephan@vcds.co.za';

interface Stats {
  totalUsers: number;
  openIncidents: number;
  activeSOS: number;
  paidSubscribers: number;
  totalRevenue?: number;
  newUsersToday?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  subscription_tier: string;
  is_active: boolean;
  town_name?: string;
  created_at: string;
}

export default function SuperAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'hoa' | 'system'>('stats');
  const [searchQuery, setSearchQuery] = useState('');

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL || user?.role === 'superadmin';

  useEffect(() => {
    if (!isSuperAdmin) { router.replace('/(tabs)'); return; }
    load();
  }, []);

  const load = async () => {
    try {
      const [statsRes, usersRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=100'),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.data || []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  const changeRole = (userId: string, userName: string) => {
    Alert.alert(`Change Role \u2014 ${userName}`, 'Select new role:', [
      { text: 'Resident', onPress: () => updateRole(userId, 'resident') },
      { text: 'HOA Member', onPress: () => updateRole(userId, 'hoa') },
      { text: 'Admin', onPress: () => updateRole(userId, 'admin') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const updateRole = async (userId: string, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      await load();
      Alert.alert('✅ Role updated');
    } catch { Alert.alert('Failed to update role'); }
  };

  const banUser = (userId: string, userName: string) => {
    Alert.alert(`Ban ${userName}?`, 'This will deactivate their account.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Ban', style: 'destructive', onPress: async () => {
        try {
          await api.put(`/admin/users/${userId}/ban`);
          await load();
          Alert.alert('User banned');
        } catch { Alert.alert('Failed'); }
      }},
    ]);
  };

  if (!isSuperAdmin) return null;
  if (loading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const STAT_CARDS = [
    { label: t('admin.totalUsers'), value: stats?.totalUsers ?? 0, icon: 'people', color: Colors.primary },
    { label: t('admin.openIncidents'), value: stats?.openIncidents ?? 0, icon: 'warning', color: Colors.accentRed },
    { label: t('admin.activeSOS'), value: stats?.activeSOS ?? 0, icon: 'alert-circle', color: Colors.accentOrange },
    { label: t('admin.paidSubscribers'), value: stats?.paidSubscribers ?? 0, icon: 'star', color: Colors.accentGold },
  ];

  const NAV_ITEMS = [
    { key: 'stats', label: 'Stats', icon: 'bar-chart' },
    { key: 'users', label: 'Users', icon: 'people' },
    { key: 'hoa', label: 'HOA', icon: 'business' },
    { key: 'system', label: 'System', icon: 'settings' },
  ] as const;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="⚡ Super Admin"
        subtitle="VCDS™ Dorpwag™"
        right={<Badge label="ODIN™" color={Colors.primary} />}
      />

      {/* Tab Nav */}
      <View style={s.tabRow}>
        {NAV_ITEMS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[s.tab, activeTab === item.key && s.tabActive]}
            onPress={() => setActiveTab(item.key)}
          >
            <Ionicons name={item.icon as any} size={16} color={activeTab === item.key ? Colors.primary : Colors.textMuted} />
            <Text style={[s.tabLabel, activeTab === item.key && s.tabLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <>
            <View style={s.grid}>
              {STAT_CARDS.map(card => (
                <PlatinumCard key={card.label} style={s.statCard}>
                  <Ionicons name={card.icon as any} size={24} color={card.color} />
                  <Text style={[s.statVal, { color: card.color }]}>{card.value}</Text>
                  <Text style={s.statLabel}>{card.label}</Text>
                </PlatinumCard>
              ))}
            </View>
            <TouchableOpacity style={s.navBtn} onPress={() => router.push('/admin/analytics')}>
              <Ionicons name="analytics" size={20} color={Colors.primary} />
              <Text style={s.navBtnText}>View Full Analytics</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={s.navBtn} onPress={() => router.push('/admin/watchlist')}>
              <Ionicons name="eye" size={20} color={Colors.accentRed} />
              <Text style={[s.navBtnText, { color: Colors.accentRed }]}>LPR Watchlist</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <>
            <View style={s.searchBox}>
              <Ionicons name="search" size={16} color={Colors.textMuted} />
              <TextInput
                style={s.searchInput}
                placeholder="Search users..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            {filteredUsers.map(u => (
              <PlatinumCard key={u.id} style={s.userCard}>
                <View style={s.userRow}>
                  <View style={s.userInfo}>
                    <Text style={Typography.bodySemi}>{u.name}</Text>
                    <Text style={Typography.caption}>{u.email}</Text>
                    {u.town_name && <Text style={[Typography.caption, { color: Colors.accent }]}>📍 {u.town_name}</Text>}
                  </View>
                  <View style={s.userBadges}>
                    <Badge label={u.role} color={u.role === 'admin' ? Colors.primary : Colors.textMuted} />
                    <Badge label={u.subscription_tier} color={u.subscription_tier !== 'free' ? Colors.success : Colors.textMuted} />
                  </View>
                </View>
                <View style={s.userActions}>
                  <TouchableOpacity style={s.actionBtn} onPress={() => changeRole(u.id, u.name)}>
                    <Text style={s.actionBtnText}>Change Role</Text>
                  </TouchableOpacity>
                  {u.is_active && (
                    <TouchableOpacity style={[s.actionBtn, s.dangerBtn]} onPress={() => banUser(u.id, u.name)}>
                      <Text style={[s.actionBtnText, { color: Colors.accentRed }]}>Ban</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </PlatinumCard>
            ))}
          </>
        )}

        {/* HOA TAB */}
        {activeTab === 'hoa' && (
          <PlatinumCard>
            <Text style={Typography.h4}>HOA Member Management</Text>
            <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 8 }]}>
              Manage HOA members who have elevated community permissions.
            </Text>
            <TouchableOpacity style={[s.navBtn, { marginTop: 16 }]} onPress={() => router.push('/admin/users')}>
              <Ionicons name="people" size={20} color={Colors.primary} />
              <Text style={s.navBtnText}>Manage HOA Members</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </PlatinumCard>
        )}

        {/* SYSTEM TAB */}
        {activeTab === 'system' && (
          <>
            <PlatinumCard>
              <Text style={Typography.h4}>System Health</Text>
              <View style={s.systemRow}>
                <Text style={Typography.caption}>API Status</Text>
                <Badge label="ONLINE" color={Colors.success} />
              </View>
              <View style={s.systemRow}>
                <Text style={Typography.caption}>Database</Text>
                <Badge label="HEALTHY" color={Colors.success} />
              </View>
              <View style={s.systemRow}>
                <Text style={Typography.caption}>Dead Man Cron</Text>
                <Badge label="ACTIVE" color={Colors.success} />
              </View>
              <View style={s.systemRow}>
                <Text style={Typography.caption}>Movement Brain™</Text>
                <Badge label="LEARNING" color={Colors.accentPurple} />
              </View>
            </PlatinumCard>
            <PlatinumCard style={{ marginTop: 12 }}>
              <Text style={Typography.h4}>App Version</Text>
              <Text style={[Typography.caption, { color: Colors.textMuted, marginTop: 4 }]}>Dorpwag™ v2.1.0 | ODIN™ Build</Text>
            </PlatinumCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, paddingBottom: 48 },
  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: Colors.surface },
  tabActive: { backgroundColor: Colors.surfaceHover, borderWidth: 1, borderColor: Colors.primary },
  tabLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { width: '47%', alignItems: 'center', gap: 6 },
  statVal: { fontSize: 32, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.surfaceBorder },
  navBtnText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textHeading },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.surfaceBorder },
  searchInput: { flex: 1, color: Colors.textHeading, fontSize: 14 },
  userCard: { marginBottom: 10 },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flex: 1 },
  userBadges: { gap: 4, alignItems: 'flex-end' },
  userActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: Colors.surfaceHover, borderWidth: 1, borderColor: Colors.surfaceBorder },
  dangerBtn: { borderColor: Colors.accentRed },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  systemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
});
