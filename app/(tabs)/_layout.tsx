import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/theme';
import i18n from '@/i18n';
import { useLanguageStore } from '@/store/language';

const TAB_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  safety: 'shield',
  community: 'people',
  directory: 'storefront',
  marketplace: 'cart',
  profile: 'person-circle',
};

export default function TabsLayout() {
  const { locale, init } = useLanguageStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    init().finally(() => setReady(true));
  }, []);

  // Wait for persisted language to load before rendering tabs
  if (!ready) return null;

  // Ensure i18n uses the current locale from the store
  i18n.locale = locale;

  const tl = (key: string) => i18n.t(key);

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
      <Tabs.Screen name="index" options={{ title: tl('tabs.home') }} />
      <Tabs.Screen name="safety" options={{ title: tl('tabs.safety') }} />
      <Tabs.Screen name="community" options={{ title: tl('tabs.community') }} />
      <Tabs.Screen name="directory" options={{ title: tl('tabs.directory') }} />
      <Tabs.Screen name="marketplace" options={{ title: tl('tabs.marketplace') }} />
      <Tabs.Screen name="profile" options={{ title: tl('tabs.profile') }} />
    </Tabs>
  );
}
