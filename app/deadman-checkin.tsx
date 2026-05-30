import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Radius } from '@/theme';
import { ScreenHeader } from '@/components/ui';
import { useAuthStore } from '@/store/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export default function DeadmanCheckin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour default
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            setActive(false);
            Alert.alert('⚠️ Tyd Verstreke', 'Jy het nie ingeskake nie. SOS is gestuur.');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active]);

  const checkin = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/deadman/checkin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      setTimeLeft(3600);
      Alert.alert('✅ Ingeskake', 'Jou timer is herlaai. Jy is veilig.');
    } catch {
      Alert.alert('Fout', 'Kon nie inskakel nie. Probeer weer.');
    } finally { setLoading(false); }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const pct = timeLeft / 3600;
  const timerColor = pct > 0.5 ? Colors.accentGreen : pct > 0.25 ? Colors.accentYellow : Colors.accentRed;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Dooie Man Skakelaar" showBack />
      <View style={s.content}>
        <Text style={[Typography.caption, { color: Colors.textMuted, textAlign: 'center', marginBottom: 32 }]}>
          As jy nie binne die tyd inskakel nie, word 'n outomatiese SOS gestuur na jou noodkontakte.
        </Text>

        {/* Timer Circle */}
        <Animated.View style={[s.timerWrap, { transform: [{ scale: pulse }] }]}>
          <View style={[s.timerCircle, { borderColor: timerColor }]}>
            <Text style={[Typography.h1, { fontSize: 48, color: timerColor }]}>{fmt(timeLeft)}</Text>
            <Text style={Typography.caption}>tyd oor</Text>
          </View>
        </Animated.View>

        {/* Status */}
        <View style={[s.statusBadge, { backgroundColor: active ? Colors.accentGreen + '20' : Colors.surface }]}>
          <View style={[s.statusDot, { backgroundColor: active ? Colors.accentGreen : Colors.textMuted }]} />
          <Text style={[Typography.bodySemi, { color: active ? Colors.accentGreen : Colors.textMuted }]}>
            {active ? 'AKTIEF — Timer Loop' : 'INAKTIEF'}
          </Text>
        </View>

        {/* Checkin Button */}
        <TouchableOpacity onPress={checkin} disabled={loading || !active} style={s.checkinBtn}>
          <LinearGradient colors={[Colors.accentGreen, Colors.accentGreen + 'AA']} style={s.checkinBtnInner}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={[Typography.button, { marginLeft: 8 }]}>Ek is Veilig — Inskakel</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Toggle */}
        <TouchableOpacity onPress={() => setActive(a => !a)} style={[s.toggleBtn, { borderColor: active ? Colors.accentRed + '60' : Colors.primary + '60' }]}>
          <Text style={[Typography.bodySemi, { color: active ? Colors.accentRed : Colors.primary }]}>
            {active ? '⏹ Stop Timer' : '▶ Begin Timer'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  timerWrap: { marginBottom: 32 },
  timerCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, marginBottom: 32 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  checkinBtn: { width: '100%', marginBottom: 12, borderRadius: 14, overflow: 'hidden' },
  checkinBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  toggleBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
});
