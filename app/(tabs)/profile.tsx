import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/theme';
import { PlatinumCard, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/auth';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [notifs, setNotifs] = useState(true);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/welcome'); } },
    ]);
  };

  const tier = user?.subscription_tier || 'free';

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', route: '/settings/edit-profile' },
        { icon: 'lock-closed-outline', label: 'Change Password', route: '/settings/change-password' },
        { icon: 'notifications-outline', label: 'Notifications', route: '/settings/notifications' },
        { icon: 'language-outline', label: 'Language (EN/AF)', route: '/settings/language' },
      ],
    },
    {
      title: 'Subscription',
      items: [
        { icon: 'star-outline', label: tier === 'paid' ? 'Pro Member ✓' : 'Upgrade to Pro', route: '/subscribe', badge: tier === 'paid' ? 'PRO' : 'FREE' },
        { icon: 'receipt-outline', label: 'Payment History', route: '/settings/payments' },
      ],
    },
    {
      title: 'Help & Legal',
      items: [
        { icon: 'help-circle-outline', label: 'Help & Support', route: '/settings/help' },
        { icon: 'document-text-outline', label: 'Terms of Service', route: '/settings/terms' },
        { icon: 'shield-outline', label: 'Privacy Policy', route: '/settings/privacy' },
      ],
    },
  ];

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 16 }}
    >
      {/* Avatar + Info */}
      <View style={s.avatarWrap}>
        <View style={s.avatar}>
          <Text style={{ fontSize: 40 }}>👤</Text>
        </View>
        <Text style={Typography.h1}>{user?.name}</Text>
        <Text style={[Typography.caption, { color: Colors.textMuted }]}>{user?.email}</Text>
        {user?.town_name ? <Text style={[Typography.caption, { color: Colors.accent, marginTop: 2 }]}>📍 {user.town_name}</Text> : null}
        <View style={s.tierBadge}>
          <Badge label={tier === 'paid' ? '⭐ PRO MEMBER' : 'FREE PLAN'} color={tier === 'paid' ? Colors.success : Colors.textMuted} />
        </View>
      </View>

      {/* Stats */}
      <PlatinumCard style={s.statsCard}>
        {[
          { label: 'Role', value: user?.role || 'Resident' },
          { label: 'Town', value: user?.town_name || 'Not set' },
          { label: 'Tier', value: tier === 'paid' ? 'Pro' : 'Free' },
        ].map((stat, i) => (
          <View key={stat.label} style={[s.statItem, i < 2 && s.statBorder]}>
            <Text style={[Typography.caption, { color: Colors.textMuted }]}>{stat.label}</Text>
            <Text style={Typography.bodySemi}>{stat.value}</Text>
          </View>
        ))}
      </PlatinumCard>

      {/* Menu Sections */}
      {menuSections.map(section => (
        <View key={section.title} style={s.section}>
          <Text style={[Typography.caption, s.sectionLabel]}>{section.title.toUpperCase()}</Text>
          <PlatinumCard style={{ padding: 0, overflow: 'hidden' }}>
            {section.items.map((item, i) => (
              <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)} style={[s.menuItem, i > 0 && s.menuBorder]}>
                <Ionicons name={item.icon as any} size={20} color={Colors.textMuted} />
                <Text style={[Typography.body, { flex: 1, marginLeft: 12 }]}>{item.label}</Text>
                {(item as any).badge ? <Badge label={(item as any).badge} variant={(item as any).badge === 'PRO' ? 'success' : 'muted'} /> : null}
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </PlatinumCard>
        </View>
      ))}

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={s.logout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.red} />
        <Text style={[Typography.bodySemi, { color: Colors.red, marginLeft: 8 }]}>Log Out</Text>
      </TouchableOpacity>
      <Text style={[Typography.caption, { textAlign: 'center', color: Colors.textMuted, marginTop: 8 }]}>Dorpwag™ v2.0.0 · VCDS™ 2026</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  tierBadge: { marginTop: 8 },
  statsCard: { flexDirection: 'row', padding: 0, marginBottom: 24, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.surfaceBorder },
  section: { marginBottom: 20 },
  sectionLabel: { color: Colors.textMuted, letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuBorder: { borderTopWidth: 1, borderTopColor: Colors.surfaceBorder },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.red + '40',
    marginTop: 8, marginBottom: 16,
  },
});
