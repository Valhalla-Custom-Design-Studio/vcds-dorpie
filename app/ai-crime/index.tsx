import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PaywallGate } from '../../src/components/PaywallGate';

export default function AiCrimeIndex() {
  const router = useRouter();
  return (
    <PaywallGate
      appId="dorpwag"
      feature="ai_crime_analysis"
      requiredTier="platinum"
      accentColor="#C9A84C"
      onUpgrade={() => router.push('/subscribe')}
    >
      <View style={styles.container}>
        <Text style={styles.title}>AI Misdaad Analise</Text>
      </View>
    </PaywallGate>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 16 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
});
