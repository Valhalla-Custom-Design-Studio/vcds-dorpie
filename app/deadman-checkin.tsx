import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../src/theme';
import { PlatinumButton } from '../src/components/ui';
import { movementAPI } from '../src/services/api';

const INTERVALS = [15, 30, 60, 120]; // minutes

export default function DeadmanCheckin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [interval, setInterval_] = useState(30);
  const [active, setActive] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<any>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;

  const start = () => {
    setActive(true);
    setRemaining(interval * 60);
    Animated.timing(progressAnim, {
      toValue: 0, duration: interval * 60 * 1000, useNativeDriver: false,
    }).start();
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(timerRef.current);
          Alert.alert('⚠️ TIMER EXPIRED', 'No check-in received. Sending alert to your community.', [{ text: 'OK' }]);
          setActive(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const checkin = async () => {
    setLoading(true);
    try {
      await movementAPI.deadman();
      clearInterval(timerRef.current);
      progressAnim.setValue(1);
      setActive(false);
      Alert.alert('✅ Check-in confirmed!', "Timer reset. You're safe.");
    } catch { Alert.alert('Check-in failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <View style={[s.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>
      <TouchableOpacity onPress={() => { clearInterval(timerRef.current); router.back(); }} style={s.close}>
        <Ionicons name="close" size={24} color={Colors.textHeading} />
      </TouchableOpacity>
      <View style={s.content}>
        <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}>⏱️</Text>
        <Text style={[Typography.display, { textAlign: 'center' }]}>Dead Man Timer</Text>
        <Text style={[Typography.body, { color: Colors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 32 }]}>
          If you don't check in, your community will be alerted
        </Text>
        {!active ? (
          <View>
            <Text style={[Typography.caption, { color: Colors.textMuted, textAlign: 'center', marginBottom: 12 }]}>SELECT INTERVAL</Text>
            <View style={s.intervals}>
              {INTERVALS.map(m => (
                <TouchableOpacity key={m} onPress={() => setInterval_(m)} style={[s.intPill, interval === m && s.intActive]}>
                  <Text style={[s.intText, interval === m && { color: '#fff' }]}>{m}m</Text>
                </TouchableOpacity>
              ))}
            </View>
            <PlatinumButton label="Start Timer" onPress={start} style={{ marginTop: 24 }} />
          </View>
        ) : (
          <View style={s.activeWrap}>
            <View style={s.timerCircle}>
              <Text style={s.timerText}>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</Text>
              <Text style={[Typography.caption, { color: Colors.textMuted }]}>remaining</Text>
            </View>
            <PlatinumButton label="✅ I'm Safe — Check In" onPress={checkin} loading={loading} variant="secondary" style={{ marginTop: 32 }} />
            <TouchableOpacity onPress={() => { clearInterval(timerRef.current); progressAnim.setValue(1); setActive(false); }} style={s.stopBtn}>
              <Text style={{ color: Colors.textMuted }}>Stop Timer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 24 },
  close: { alignSelf: 'flex-end', padding: 8 },
  content: { flex: 1, justifyContent: 'center' },
  intervals: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  intPill: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surfaceBorder },
  intActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  intText: { color: Colors.textBody, fontWeight: '700', fontSize: 16 },
  activeWrap: { alignItems: 'center' },
  timerCircle: {
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 4, borderColor: Colors.warning,
    alignItems: 'center', justifyContent: 'center',
  },
  timerText: { fontSize: 48, fontWeight: '800', color: Colors.textHeading },
  stopBtn: { marginTop: 16, padding: 12 },
});
