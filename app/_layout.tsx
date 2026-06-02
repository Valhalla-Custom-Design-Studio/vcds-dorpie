import React from 'react';
import { Stack, Redirect, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/theme';
import { useAuthStore } from '@/store/auth';
import { posthog } from '@/lib/posthog';
import { initSentry } from '@/lib/sentry';
import AnimatedSplash from '../src/components/AnimatedSplash';

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
  const inTabs = segments[0] === '(tabs)';

  // Not logged in and not in auth flow → go to welcome
  if (!user && !inAuth) return <Redirect href="/(auth)/welcome" />;
  // Logged in but stuck in auth flow → go to tabs root
  if (user && inAuth) return <Redirect href="/(tabs)" />;

  return <>{children}</>;
}

export default function RootLayout() {
  const [splashDone, setSplashDone] = React.useState(false);
  if (!splashDone) return <AnimatedSplash onFinish={() => setSplashDone(true)} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg }, animation: 'slide_from_right' }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="index" />
            <Stack.Screen name="sos-active" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="emergency-alert/[sosId]" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="deadman-checkin" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="movement-checkin" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="sos-evidence/[sosId]" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="subscribe" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="geofence" />
            <Stack.Screen name="mood" />
            <Stack.Screen name="sos-contacts" />
            <Stack.Screen name="guardian" />
            <Stack.Screen name="heatmap" />
            <Stack.Screen name="ai-crime" />
            <Stack.Screen name="incidents" />
            <Stack.Screen name="notices" />
            <Stack.Screen name="events" />
            <Stack.Screen name="topics" />
            <Stack.Screen name="businesses" />
            <Stack.Screen name="patrols" />
            <Stack.Screen name="listings" />
            <Stack.Screen name="messages" />
            <Stack.Screen name="alerts" />
            <Stack.Screen name="payments" />
            <Stack.Screen name="lpr" />
            <Stack.Screen name="phantom-alert" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          </Stack>
        </AuthGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
