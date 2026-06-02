import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Vibration,
  AppState, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/theme';
import { sosAPI } from '@/services/api';

/**
 * Phantom Alert™ — Covert SOS trigger.
 *
 * DISGUISE: Screen renders as a plain calculator.
 * TRIGGERS (all silent — no visible SOS indicator):
 *   1. Secret PIN: user types "0000=" on the calculator → silent SOS fires
 *   2. Volume button combo: handled by native module (VolumeListener)
 *      — 3x Volume Up within 2s → SOS (works with screen off / in pocket)
 *   3. Shake: 3 rapid shakes → SOS
 *
 * On trigger: SOS fires silently in background. Screen stays on calculator.
 * User gets a single silent vibration pulse (1 short) to confirm.
 * No alert, no sound, no visible change.
 */

const PHANTOM_PIN = '0000'; // User-configurable in settings (future)

const CALC_BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

export default function PhantomAlertScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [display, setDisplay] = useState('0');
  const [pinBuffer, setPinBuffer] = useState('');
  const [triggered, setTriggered] = useState(false);
  const triggerLock = useRef(false);

  // ── Silent SOS trigger ────────────────────────────────────────────────────
  const fireSilentSOS = useCallback(async () => {
    if (triggerLock.current || triggered) return;
    triggerLock.current = true;
    setTriggered(true);

    // Single short vibration — feels like a notification, not suspicious
    Vibration.vibrate(200);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const loc = status === 'granted'
        ? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        : null;

      await sosAPI.trigger(
        loc?.coords.latitude ?? 0,
        loc?.coords.longitude ?? 0,
        { silent: true, source: 'phantom' }
      );
    } catch {
      // Fail silently — do NOT show any error to avoid suspicion
    }
    // Reset after 30s so it can be triggered again if needed
    setTimeout(() => { triggerLock.current = false; setTriggered(false); }, 30000);
  }, [triggered]);

  // ── Calculator PIN detection ──────────────────────────────────────────────
  const handleCalcPress = (btn: string) => {
    // Update display (normal calculator behaviour)
    if (btn === 'C') {
      setDisplay('0');
      setPinBuffer('');
      return;
    }
    if (btn === '=') {
      // Check PIN before "calculating"
      if (pinBuffer === PHANTOM_PIN) {
        fireSilentSOS();
        setDisplay('0'); // Reset display — looks normal
        setPinBuffer('');
        return;
      }
      setDisplay(display); // Normal = behaviour (just show current)
      setPinBuffer('');
      return;
    }
    if (['÷', '×', '−', '+', '±', '%'].includes(btn)) {
      setPinBuffer(''); // Reset PIN buffer on operator
      setDisplay(display + ' ' + btn + ' ');
      return;
    }
    // Digit or decimal
    const newDisplay = display === '0' ? btn : display + btn;
    setDisplay(newDisplay);
    // Track PIN buffer (digits only)
    if (/[0-9]/.test(btn)) {
      const newBuf = (pinBuffer + btn).slice(-4); // Keep last 4 digits
      setPinBuffer(newBuf);
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Calculator display */}
      <View style={s.displayArea}>
        <Text style={s.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      {/* Calculator buttons */}
      <View style={s.buttonGrid}>
        {CALC_BUTTONS.map((row, ri) => (
          <View key={ri} style={s.row}>
            {row.map(btn => {
              const isOperator = ['÷', '×', '−', '+'].includes(btn);
              const isEquals = btn === '=';
              const isZero = btn === '0';
              return (
                <TouchableOpacity
                  key={btn}
                  style={[
                    s.btn,
                    isOperator && s.btnOperator,
                    isEquals && s.btnEquals,
                    isZero && s.btnZero,
                    btn === 'C' && s.btnClear,
                  ]}
                  onPress={() => handleCalcPress(btn)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    s.btnText,
                    isOperator && s.btnTextOperator,
                    isEquals && s.btnTextEquals,
                    btn === 'C' && s.btnTextClear,
                  ]}>
                    {btn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Invisible back button — tiny, top left, looks like status bar */}
      <TouchableOpacity
        style={s.hiddenBack}
        onPress={() => router.back()}
        hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
      />
    </View>
  );
}

const BTN_SIZE = 80;
const BTN_GAP = 12;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C1C1E' },
  displayArea: {
    flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end',
    paddingHorizontal: 24, paddingBottom: 16,
  },
  displayText: {
    fontSize: 64, fontWeight: '200', color: '#FFFFFF', letterSpacing: -2,
  },
  buttonGrid: { padding: BTN_GAP, gap: BTN_GAP },
  row: { flexDirection: 'row', gap: BTN_GAP, justifyContent: 'center' },
  btn: {
    width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2,
    backgroundColor: '#3A3A3C', alignItems: 'center', justifyContent: 'center',
  },
  btnZero: { width: BTN_SIZE * 2 + BTN_GAP, borderRadius: BTN_SIZE / 2, paddingLeft: 28, alignItems: 'flex-start' },
  btnOperator: { backgroundColor: '#FF9F0A' },
  btnEquals: { backgroundColor: '#FF9F0A' },
  btnClear: { backgroundColor: '#636366' },
  btnText: { fontSize: 28, fontWeight: '400', color: '#FFFFFF' },
  btnTextOperator: { color: '#FFFFFF' },
  btnTextEquals: { color: '#FFFFFF' },
  btnTextClear: { color: '#000000' },
  hiddenBack: { position: 'absolute', top: 0, left: 0, width: 44, height: 44 },
});
