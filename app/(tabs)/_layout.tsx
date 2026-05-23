import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme';
import { BlurView } from 'expo-blur';
import { Platform, View, StyleSheet } from 'react-native';

const TAB_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  safety: 'shield',
  community: 'people',
  directory: 'storefront',
  profile: 'person-circle',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBg,
          borderTopColor: Colors.surfaceBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const name = TAB_ICON[route.name] || 'ellipse';
          const outlined = (name + (focused ? '' : '-outline')) as keyof typeof Ionicons.glyphMap;
          return <Ionicons name={outlined} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="safety" options={{ title: 'Safety' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="directory" options={{ title: 'Directory' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
