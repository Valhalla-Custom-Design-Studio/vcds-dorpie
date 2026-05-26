import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../src/theme';
import { useAuthStore } from '../src/store/auth';
import { posthog } from '../src/lib/posthog';
import { initSentry } from '../src/lib/sentry';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) router.replace('/(auth)/welcome');
    if (user && inAuth) router.replace('/(tabs)');
  }, [user, segments]);

  return <>{children}</>;
}

initSentry();
posthog.capture('app_opened');

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
