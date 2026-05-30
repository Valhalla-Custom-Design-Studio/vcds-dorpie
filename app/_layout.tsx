import React, { useEffect, useState } from 'react';
import { Stack, Redirect, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/theme';
import { useAuthStore } from '@/store/auth';
import { posthog } from '@/lib/posthog';
import { initSentry } from '@/lib/sentry';

initSentry();
posthog.capture('app_opened');

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated } = useAuthStore();
  const segments = useSegments();

  // Wait for Zustand persist to hydrate from AsyncStorage
  if (!_hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const inAuth = segments[0] === '(auth)';

  if (!user && !inAuth) return <Redirect href="/(auth)/welcome" />;
  if (user && inAuth) return <Redirect href="/(tabs)/index" />;

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg }, animation: 'slide_from_right' }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="sos-active" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="emergency-alert/[sosId]" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="deadman-checkin" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="movement-checkin" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="sos-evidence/[sosId]" />
          </Stack>
        </AuthGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
