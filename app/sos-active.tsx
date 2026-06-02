import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Easing, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/theme';
import { sosAPI } from '@/services/api';

export default function SOSActive() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<'idle' | 'locating' | 'sending' | 'active' | 'error'>('idle');
  const [sosId, setSosId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const triggerSOS = async () => {
    setStatus('locating');
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') { Alert.alert('Location permission required'); setStatus('idle'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setStatus('sending');
      const { data } = await sosAPI.trigger({ lat: loc.coords.latitude, lng: loc.coords.longitude, source: 'manual', triggerMethod: 'button', appName: 'dorpwag' });
      setSosId(data.data?.id);
      setStatus('active');
    } catch (e) {
      setStatus('error');
    }
  };

  const resolve = async () => {
    if (sosId) {
      try { await sosAPI.resolve(sosId); } catch {}
    }
    router.back();
  };

  const start5 = () => {
    setCountdown(5);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current); triggerSOS(); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const cancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(5);
    setStatus('idle');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <TouchableOpacity onPress={() => { cancel(); router.back(); }} style={s.closeBtn}>
        <Ionicons name="close" size={24} color={Colors.textHeading} />
      </TouchableOpacity>

      <View style={s.center}>
        {/* Pulse rings */}
        <Animated.View style={[s.pulseRing, s.ring3, { transform: [{ scale: pulseAnim }] }]} />
        <Animated.View style={[s.pulseRing, s.ring2, { transform: [{ scale: Animated.add(Animated.multiply(pulseAnim, 0.8), 0.2) }] }]} />

        <View style={s.sosCircle}>
          {status === 'locating' || status === 'sending' ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : status === 'active' ? (
            <Ionicons name="checkmark" size={60} color="#fff" />
          ) : (
            <Ionicons name="warning" size={60} color="#fff" />
          )}
        </View>

        <Text style={s.title}>
          {status === 'idle' && 'Emergency SOS'}
          {status === 'locating' && 'Getting Location...'}
          {status === 'sending' && 'Sending Alert...'}
          {status === 'active' && '🚨 ALERT SENT'}
          {status === 'error' && 'Failed to Send'}
        </Text>

        <Text style={s.sub}>
          {status === 'idle' && 'Tap the button to alert your community immediately'}
          {status === 'locating' && 'Fetching your GPS coordinates'}
          {status === 'sending' && 'Notifying community members...'}
          {status === 'active' && `SOS #${sosId?.slice(0,8)} \u2022 Your community has been alerted`}
          {status === 'error' && 'Could not send SOS. Check your connection.'}
        </Text>

        {countdown < 5 && status === 'idle' && (
          <View style={s.countdownBox}>
            <Text style={s.countdownText}>{countdown}</Text>
            <TouchableOpacity onPress={cancel} style={s.cancelBtn}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'idle' && countdown === 5 && (
          <TouchableOpacity onPress={start5} style={s.triggerBtn} activeOpacity={0.8}>
            <Text style={s.triggerText}>HOLD TO TRIGGER SOS</Text>
          </TouchableOpacity>
        )}

        {status === 'active' && (
          <View style={s.actions}>
            <TouchableOpacity onPress={() => router.push(`/sos-evidence/${sosId}`)} style={s.evidenceBtn}>
              <Ionicons name="camera" size={20} color={Colors.textHeading} />
              <Text style={[Typography.body, { marginLeft: 8 }]}>Add Evidence</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resolve} style={s.resolveBtn}>
              <Text style={s.resolveText}>I'm Safe — Resolve SOS</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'error' && (
          <TouchableOpacity onPress={triggerSOS} style={s.retryBtn}>
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0010' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  pulseRing: { position: 'absolute', borderRadius: 999, borderWidth: 2, borderColor: Colors.red + '30' },
  ring2: { width: 220, height: 220 },
  ring3: { width: 300, height: 300, borderColor: Colors.red + '15' },
  sosCircle: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: Colors.red, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.red, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 20,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textHeading, marginTop: 32, textAlign: 'center' },
  sub: { fontSize: 15, color: Colors.textBody, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  countdownBox: { alignItems: 'center', marginTop: 32 },
  countdownText: { fontSize: 72, fontWeight: '900', color: Colors.red },
  cancelBtn: { marginTop: 16, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: Colors.surfaceBorder },
  cancelText: { color: Colors.textHeading, fontSize: 16, fontWeight: '600' },
  triggerBtn: {
    marginTop: 40, paddingHorizontal: 32, paddingVertical: 18,
    backgroundColor: Colors.red, borderRadius: 32,
    shadowColor: Colors.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 20,
  },
  triggerText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  actions: { gap: 12, marginTop: 32, width: '100%' },
  evidenceBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.surfaceBorder, borderRadius: 16, padding: 14,
  },
  resolveBtn: { backgroundColor: Colors.success, borderRadius: 16, padding: 16 },
  resolveText: { color: '#fff', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  retryBtn: { marginTop: 24, backgroundColor: Colors.red, borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
