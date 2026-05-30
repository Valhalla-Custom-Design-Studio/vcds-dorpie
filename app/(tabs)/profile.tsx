import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Switch, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Radius, Shadow } from '@/theme';
import { PlatinumCard, Badge, SectionHeader } from '@/components/ui';
import { useAuthStore } from '@/store/auth';

const { width } = Dimensions.get('window');

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const [notifs, setNotifs] = useState(true);

  const handleLogout = () => {
    Alert.alert('Teken Uit', 'Is jy seker jy wil uitlog?', [
      { text: 'Kanselleer', style: 'cancel' },
      { text: 'Uitlog', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/welcome'); } },
    ]);
  };

  const tier = user?.subscription_tier || 'free';
  const isPro = tier === 'paid' || tier === 'pro';

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
        { icon: 'star-outline', label: isPro ? 'Pro Lid ✓' : 'Opgradeer na Pro', route: '/subscribe', badge: isPro ? 'PRO' : 'GRATIS' },
        { icon: 'receipt-outline', label: 'Betalingsgeskiedenis', route: '/settings/payments' },
      ],
    },
    {
      title: 'Hulp & Regsake',
      items: [
        { icon: 'help-circle-outline', label: 'Hulp & Ondersteuning', route: '/settings/help' },
        { icon: 'document-text-outline', label: 'Diensvoorwaardes', route: '/settings/terms' },
        { icon: 'shield-outline', label: 'Privaatheidsbeleid', route: '/settings/privacy' },
      ],
    },
  ];

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Hero Avatar */}
      <LinearGradient colors={[Colors.primaryDark + 'CC', Colors.bg]} style={[s.hero, { paddingTop: insets.top + 16 }]}>
        <View style={s.avatarWrap}>
          <View style={[s.avatarGlow, { ...Shadow.glow(Colors.primary) }]}>
            <View style={s.avatar}>
              <Text style={{ fontSize: 44 }}>👤</Text>
            </View>
          </View>
          <Text style={[Typography.h2, { marginTop: 12 }]}>{user?.name || 'Inwoner'}</Text>
          <Text style={[Typography.caption, { color: Colors.textMuted }]}>{user?.email}</Text>
          {user?.town_name ? (
            <View style={s.townRow}>
              <Ionicons name="location" size={12} color={Colors.accent} />
              <Text style={[Typography.caption, { color: Colors.accent, marginLeft: 4 }]}>{user.town_name}</Text>
            </View>
          ) : null}
          <View style={{ marginTop: 8 }}>
            <Badge label={isPro ? '⭐ PRO LID' : 'GRATIS PLAN'} color={isPro ? Colors.success : Colors.textMuted} />
          </View>
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          {[
            { label: 'Rol', value: user?.role || 'Inwoner' },
            { label: 'Dorp', value: user?.town_name || '—' },
            { label: 'Plan', value: isPro ? 'Pro' : 'Gratis' },
          ].map(stat => (
            <View key={stat.label} style={s.statItem}>
              <Text style={[Typography.bodySemi, { fontSize: 13 }]}>{stat.value}</Text>
              <Text style={Typography.caption}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={s.content}>
        {/* Upgrade Banner (free users) */}
        {!isPro && (
          <TouchableOpacity onPress={() => router.push('/subscribe')}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={s.upgradeBanner}>
              <Ionicons name="star" size={20} color={Colors.accent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[Typography.bodySemi, { color: '#fff' }]}>Opgradeer na Pro</Text>
                <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>Ontsluit alle veiligheidskenmerke</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.accent} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Notifications Toggle */}
        <PlatinumCard style={s.notifsCard}>
          <View style={s.notifsRow}>
            <Ionicons name="notifications" size={20} color={Colors.primary} />
            <Text style={[Typography.bodySemi, { flex: 1, marginLeft: 12 }]}>Kennisgewings</Text>
            <Switch
              value={notifs}
              onValueChange={setNotifs}
              trackColor={{ true: Colors.primary, false: Colors.surface }}
              thumbColor={notifs ? Colors.accent : Colors.textMuted}
            />
          </View>
        </PlatinumCard>

        {/* Menu Sections */}
        {menuSections.map(section => (
          <View key={section.title} style={s.section}>
            <SectionHeader title={section.title} />
            {section.items.map(item => (
              <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)}>
                <PlatinumCard style={s.menuItem}>
                  <View style={s.menuRow}>
                    <View style={[s.menuIcon, { backgroundColor: Colors.surface }]}>
                      <Ionicons name={item.icon as any} size={18} color={Colors.textBody} />
                    </View>
                    <Text style={[Typography.body, { flex: 1 }]}>{item.label}</Text>
                    {(item as any).badge && <Badge label={(item as any).badge} color={isPro ? Colors.success : Colors.textMuted} />}
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </View>
                </PlatinumCard>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={Colors.accentRed} />
          <Text style={[Typography.bodySemi, { color: Colors.accentRed, marginLeft: 8 }]}>Teken Uit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  hero: { paddingHorizontal: 16, paddingBottom: 24 },
  avatarWrap: { alignItems: 'center', marginBottom: 20 },
  avatarGlow: { borderRadius: 50, padding: 3 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary + '60' },
  townRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statItem: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, padding: 12, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: Colors.surfaceBorder },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  upgradeBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 16 },
  notifsCard: { marginBottom: 16 },
  notifsRow: { flexDirection: 'row', alignItems: 'center' },
  section: { marginBottom: 16 },
  menuItem: { marginBottom: 6 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.accentRed + '40', backgroundColor: Colors.accentRed + '10' },
});
