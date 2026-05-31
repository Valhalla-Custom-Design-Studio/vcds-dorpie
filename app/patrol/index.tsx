import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PaywallGate } from '../../src/components/PaywallGate';
import { useSubscription } from '../../src/hooks/useSubscription';

export default function PatrolIndex() {
  const router = useRouter();
  const { hasFeature, loading } = useSubscription('dorpwag');

  return (
    <PaywallGate
      appId="dorpwag"
      feature="patrol_management"
      requiredTier="pro"
      accentColor="#C9A84C"
      onUpgrade={() => router.push('/subscribe')}
    >
      {/* Existing patrol content renders here when unlocked */}
      <View style={styles.container}>
        <Text style={styles.title}>Patrollie Bestuur</Text>
      </View>
    </PaywallGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 16 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
});
