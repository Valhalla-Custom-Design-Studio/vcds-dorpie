import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../src/theme';
import { PlatinumCard } from '../../src/components/ui';

export default function Community() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const sections = [
    { icon: 'document-text', label: 'Notice Board', sub: 'Town announcements & news', route: '/notices', color: Colors.primary },
    { icon: 'calendar', label: 'Events', sub: "What's happening in your area", route: '/events', color: Colors.accent },
    { icon: 'chatbubbles', label: 'Forum', sub: 'Discussions & community topics', route: '/topics', color: Colors.success },
    { icon: 'bag', label: 'Marketplace', sub: 'Buy, sell & swap locally', route: '/listings', color: Colors.warning },
    { icon: 'chatbubble-ellipses', label: 'Messages', sub: 'Private conversations', route: '/messages', color: Colors.primaryLight },
  ];

  return (
    <View style={[s.container, { paddingTop: insets.top + 16 }]}>
      <View style={s.header}>
        <Text style={Typography.h1}>🤝 Community</Text>
        <Text style={[Typography.caption, { color: Colors.textMuted }]}>Stay connected with your neighbours</Text>
      </View>
      <View style={s.list}>
        {sections.map(item => (
          <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)}>
            <PlatinumCard style={s.card}>
              <View style={s.row}>
                <View style={[s.icon, { backgroundColor: item.color + '20', borderColor: item.color + '40' }]}>
                  <Ionicons name={item.icon as any} size={26} color={item.color} />
                </View>
                <View style={s.content}>
                  <Text style={Typography.bodySemi}>{item.label}</Text>
                  <Text style={Typography.caption}>{item.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
              </View>
            </PlatinumCard>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 16 },
  header: { marginBottom: 24 },
  list: { gap: 8 },
  card: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  content: { flex: 1 },
});
