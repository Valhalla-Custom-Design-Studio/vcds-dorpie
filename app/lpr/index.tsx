import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PaywallGate } from '../../src/components/PaywallGate';

export default function LprIndex() {
  const router = useRouter();
  return (
    <PaywallGate
      appId="dorpwag"
      feature="lpr_recognition"
      requiredTier="platinum"
      accentColor="#C9A84C"
      onUpgrade={() => router.push('/subscribe')}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Nommerbord Herkenning</Text>
      </View>
    </PaywallGate>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 16 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
});
