import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { PlatinumCard, Badge, ScreenHeader } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { profileAPI } from '@/services/api';
import { t } from '@/i18n';

const SUPER_ADMIN_EMAIL = 'stephan@vcds.co.za';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({ alerts: 0, patrols: 0, reports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileAPI.get()
      .then(r => { if (r.data?.data?.stats) setStats(r.data.data.stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/welcome'); } },
    ]);
  };

  const tier = user?.subscription_tier || 'free';
  const tierLabel = tier === 'guardian' ? t('payment.guardian') : tier === 'community' ? t('payment.community') : t('payment.free');
  const tierColor = tier === 'guardian' ? Colors.success : tier === 'community' ? Colors.primary : Colors.textMuted;
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL || user?.role === 'superadmin';
  const isAdmin = isSuperAdmin || user?.role === 'admin';

  const menuSections = [
    {
      title: t('profile.account'),
      items: [
        { icon: 'person-outline', label: t('profile.editProfile'), route: '/settings/edit-profile' },
        { icon: 'lock-closed-outline', label: t('profile.changePassword'), route: '/settings/change-password' },
        { icon: 'notifications-outline', label: t('profile.notifications'), route: '/settings/notifications' },
        { icon: 'language-outline', label: t('profile.language'), route: '/settings/language' },
      ],
    },
    {
      title: 'Veiligheid / Safety',
      items: [
        { icon: 'alert-circle-outline', label: t('profile.emergencyContacts'), route: '/sos-contacts', badge: 'SOS', badgeColor: Colors.accentRed },
        { icon: 'shield-checkmark-outline', label: t('profile.guardianSettings'), route: '/guardian' },
        { icon: 'analytics-outline', label: t('movement.title'), route: '/movement-checkin' },
        { icon: 'timer-outline', label: t('safety.deadman'), route: '/deadman-checkin' },
      ],
    },
    {
      title: t('profile.subscription'),
      items: [
        { icon: 'star-outline', label: tier !== 'free' ? `${tierLabel} \u2713` : 'Opgradeer na Pro', route: '/subscribe', badge: tierLabel, badgeColor: tierColor },
        { icon: 'receipt-outline', label: t('profile.paymentHistory'), route: '/settings/payments' },
      ],
    },
    {
      title: t('profile.helpLegal'),
      items: [
        { icon: 'help-circle-outline', label: t('profile.help'), route: '/settings/help' },
        { icon: 'document-text-outline', label: t('profile.terms'), route: '/settings/terms' },
        { icon: 'shield-outline', label: t('profile.privacy'), route: '/settings/privacy' },
      ],
    },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={t('profile.title')}
        right={isAdmin ? (
          <TouchableOpacity onPress={() => router.push('/admin')}>
            <Ionicons name="settings" size={24} color={Colors.primary} />
          </TouchableOpacity>
        ) : undefined}
      />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={[s.avatarCircle, isSuperAdmin && { borderColor: Colors.accentGold, borderWidth: 3, ...Shadow.glow }]}>
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
          <View style={s.badgeRow}>
            <Badge label={tierLabel} color={tierColor} />
            {isSuperAdmin && <Badge label="⚡ SUPER ADMIN" color={Colors.accentGold} />}
            {!isSuperAdmin && isAdmin && <Badge label="ADMIN" color={Colors.primary} />}
          </View>
        </View>

        {/* Stats */}
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
        ) : (
          <PlatinumCard style={s.statsCard}>
            {[
              { label: t('profile.alerts'), value: stats.alerts, icon: 'warning-outline', color: Colors.accentRed },
              { label: t('profile.patrols'), value: stats.patrols, icon: 'shield-outline', color: Colors.primary },
              { label: t('profile.reports'), value: stats.reports, icon: 'document-text-outline', color: Colors.accentPurple },
            ].map(stat => (
              <View key={stat.label} style={s.statItem}>
                <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                <Text style={[s.statVal, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </PlatinumCard>
        )}

        {/* Menu Sections */}
        {menuSections.map(section => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <PlatinumCard style={s.sectionCard}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.route}
                  style={[s.menuItem, i < section.items.length - 1 && s.menuBorder]}
                  onPress={() => router.push(item.route as any)}
                >
                  <Ionicons name={item.icon as any} size={20} color={Colors.textMuted} />
                  <Text style={s.menuLabel}>{item.label}</Text>
                  {item.badge && <Badge label={item.badge} color={item.badgeColor ?? Colors.textMuted} />}
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </PlatinumCard>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.accentRed} />
          <Text style={s.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <Text style={s.version}>Dorpwag™ v2.1.0 | VCDS™ Holdings</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 48 },
  avatarSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarEmoji: { fontSize: 40 },
  name: { fontSize: 22, fontWeight: '700', color: Colors.textHeading, marginBottom: 2 },
  email: { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  townRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  townText: { fontSize: 13, color: Colors.accent },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  statsCard: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginBottom: 8 },
  statItem: { alignItems: 'center', gap: 4 },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textMuted },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 8 },
  sectionCard: { padding: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.textHeading },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, padding: 14, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.accentRed },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.accentRed },
  version: { textAlign: 'center', fontSize: 11, color: Colors.textMuted, marginBottom: 16 },
});
