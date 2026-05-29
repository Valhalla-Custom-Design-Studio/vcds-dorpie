import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { PlatinumCard, Badge, ScreenHeader } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { profileAPI } from '@/services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({ alerts: 0, patrols: 0, reports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileAPI.get()
      .then(r => {
        if (r.data?.data?.stats) setStats(r.data.data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Alert.alert('Teken Uit', 'Is jy seker jy wil uitteken?', [
      { text: 'Kanselleer', style: 'cancel' },
      { text: 'Teken Uit', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/welcome'); } },
    ]);
  };

  const tier = user?.subscription_tier || 'free';
  const tierLabel = tier === 'guardian' ? 'Bewaker™ PRO' : tier === 'community' ? 'Gemeenskap' : 'Gratis';
  const tierColor = tier === 'guardian' ? Colors.success : tier === 'community' ? Colors.primary : Colors.textMuted;

  const menuSections = [
    {
      title: 'Rekening',
      items: [
        { icon: 'person-outline', label: 'Wysig Profiel', route: '/settings/edit-profile' },
        { icon: 'lock-closed-outline', label: 'Verander Wagwoord', route: '/settings/change-password' },
        { icon: 'notifications-outline', label: 'Kennisgewings', route: '/settings/notifications' },
        { icon: 'language-outline', label: 'Taal (EN/AF)', route: '/settings/language' },
      ],
    },
    {
      title: 'Intekening',
      items: [
        { icon: 'star-outline', label: tier !== 'free' ? `${tierLabel} ✓` : 'Opgradeer na Pro', route: '/subscribe', badge: tierLabel },
        { icon: 'receipt-outline', label: 'Betalingsgeskiedenis', route: '/settings/payments' },
      ],
    },
    {
      title: 'Hulp & Wetlik',
      items: [
        { icon: 'help-circle-outline', label: 'Hulp & Ondersteuning', route: '/settings/help' },
        { icon: 'document-text-outline', label: 'Gebruiksvoorwaardes', route: '/settings/terms' },
        { icon: 'shield-outline', label: 'Privaatheidsbeleid', route: '/settings/privacy' },
      ],
    },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Profiel" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarEmoji}>👤</Text>
          </View>
          <Text style={s.name}>{user?.name}</Text>
          <Text style={s.email}>{user?.email}</Text>
          {user?.town_name && (
            <View style={s.townRow}>
              <Ionicons name="location-outline" size={14} color={Colors.accent} />
              <Text style={s.townText}>{user.town_name}</Text>
            </View>
          )}
          <View style={s.badgeWrap}>
            <Badge label={tierLabel} color={tierColor} />
          </View>
        </View>

        {/* Stats */}
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
        ) : (
          <PlatinumCard style={s.statsCard}>
            {[
              { label: 'Waarskuwings', value: stats.alerts, icon: 'warning-outline' },
              { label: 'Patrollies', value: stats.patrols, icon: 'shield-outline' },
              { label: 'Verslae', value: stats.reports, icon: 'document-text-outline' },
            ].map((s2, i) => (
              <View key={s2.label} style={[s.statItem, i < 2 && s.statBorder]}>
                <Ionicons name={s2.icon as any} size={20} color={Colors.primary} />
                <Text style={s.statNum}>{s2.value}</Text>
                <Text style={s.statLabel}>{s2.label}</Text>
              </View>
            ))}
          </PlatinumCard>
        )}

        {/* Menu sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <PlatinumCard style={s.menuCard}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.menuItem, i < section.items.length - 1 && s.menuBorder]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={s.menuIconWrap}>
                    <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                  </View>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  {item.badge && <Badge label={item.badge} color={tierColor} />}
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </PlatinumCard>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.red} />
          <Text style={s.logoutText}>Teken Uit</Text>
        </TouchableOpacity>

        <Text style={s.version}>Dorpwag™ v2.0 · VCDS™</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md, paddingBottom: 48 },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.surface,
    borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md, ...Shadow.glow,
  },
  avatarEmoji: { fontSize: 44 },
  name: { ...Typography.h2, marginBottom: 4 },
  email: { ...Typography.body, color: Colors.textMuted },
  townRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  townText: { ...Typography.bodySmall, color: Colors.accent },
  badgeWrap: { marginTop: 10 },
  statsCard: { flexDirection: 'row', padding: 0, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.surfaceBorder },
  statNum: { ...Typography.h2, fontSize: 24, marginTop: 4 },
  statLabel: { ...Typography.caption, marginTop: 2 },
  section: { marginTop: Spacing.lg },
  sectionTitle: { ...Typography.label, marginBottom: Spacing.sm, paddingHorizontal: 4 },
  menuCard: { padding: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { ...Typography.body, flex: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: Spacing.xl, padding: Spacing.md,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.red,
    backgroundColor: 'rgba(220,38,38,0.08)',
  },
  logoutText: { color: Colors.red, fontWeight: '700', fontSize: 16 },
  version: { ...Typography.caption, textAlign: 'center', marginTop: Spacing.xl, color: Colors.textMuted },
});
