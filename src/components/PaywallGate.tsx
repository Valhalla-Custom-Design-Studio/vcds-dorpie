import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSubscription } from '../hooks/useSubscription';
import { useAuthStore } from '../store/auth';

interface PaywallGateProps {
  appId: string;
  feature: string;
  requiredTier: 'pro' | 'platinum' | 'elite' | 'starter' | 'business' | 'enterprise';
  accentColor?: string;
  onUpgrade?: () => void;
  children: React.ReactNode;
}

// Tier hierarchy — higher index = higher tier
const TIER_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
  platinum: 4,
  enterprise: 5,
  elite: 6,
};

function tierMeetsRequirement(userTier: string, required: string): boolean {
  const userRank = TIER_RANK[userTier?.toLowerCase()] ?? 0;
  const reqRank  = TIER_RANK[required?.toLowerCase()] ?? 99;
  return userRank >= reqRank;
}

export function PaywallGate({
  appId,
  feature,
  requiredTier,
  accentColor = '#C9A84C',
  onUpgrade,
  children,
}: PaywallGateProps) {
  const { hasFeature, loading, subscription } = useSubscription(appId);

  // Fallback: read tier directly from local auth store (covers promo + manual DB updates)
  const localTier = useAuthStore(s => s.user?.subscription_tier) || 'free';

  if (loading) return null;

  // Access granted if:
  // 1. PayFast SDK says feature is included, OR
  // 2. Local auth store tier meets the requirement (promo / manual grant)
  const sdkAllows   = hasFeature(feature);
  const localAllows = tierMeetsRequirement(localTier, requiredTier);

  if (sdkAllows || localAllows) return <>{children}</>;

  const tierLabels: Record<string, string> = {
    pro: 'Pro',
    platinum: 'Platinum',
    elite: 'Elite',
    starter: 'Starter',
    business: 'Business',
    enterprise: 'Enterprise',
  };

  return (
    <View style={styles.gate}>
      <Text style={[styles.lockIcon]}>🔒</Text>
      <Text style={styles.title}>
        {tierLabels[requiredTier] || requiredTier} Funksie
      </Text>
      <Text style={styles.subtitle}>
        Gradeer op na {tierLabels[requiredTier]} om hierdie funksie te gebruik.
      </Text>
      {onUpgrade && (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: accentColor }]}
          onPress={onUpgrade}
        >
          <Text style={styles.btnText}>Gradeer Op</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  lockIcon: { fontSize: 48 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: {
    color: '#0A0A0A',
    fontWeight: '700',
    fontSize: 15,
  },
});
