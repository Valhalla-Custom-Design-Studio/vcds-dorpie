import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../src/theme';
import { useAuthStore } from '../../src/store/auth';
import { authAPI } from '../../src/services/api';

export default function PaymentWebview() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const handleNav = async (navState: any) => {
    const navUrl: string = navState.url || '';
    // PayFast redirects to return/cancel URLs
    if (navUrl.includes('/payments/success') || navUrl.includes('return_url')) {
      try {
        const me = await authAPI.me();
        setUser(me.data.data);
        Alert.alert('Sukses', 'Jou intekening is geaktiveer!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') },
        ]);
      } catch {
        router.replace('/(tabs)');
      }
    } else if (navUrl.includes('/payments/cancel') || navUrl.includes('cancel_url')) {
      Alert.alert('Gekanselleer', 'Betaling is gekanselleer.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  if (!url) {
    return (
      <View style={s.center}>
        <Text style={Typography.body}>Geen betaling URL nie.</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={{ color: Colors.primary }}>Terug</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.textBody} />
        </TouchableOpacity>
        <Text style={s.title}>Betaling</Text>
        {loading && <ActivityIndicator color={Colors.primary} style={{ marginRight: 4 }} />}
      </View>
      <WebView
        source={{ uri: url }}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNav}
        style={s.webview}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  closeBtn: { marginRight: 12 },
  title: { ...Typography.h4, flex: 1 },
  webview: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  backBtn: { marginTop: 16, padding: 12 },
});
