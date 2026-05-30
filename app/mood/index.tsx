import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';
import { PlatinumCard, ScreenHeader, Badge } from '@/components/ui';
import { api } from '@/services/api';
import { t } from '@/i18n';

type Mood = 'happy' | 'sad' | 'neutral' | 'pain' | 'anxious' | 'confused' | 'unknown';

interface MoodResult {
  mood: Mood;
  confidence: number;
  description: string;
  recommendation: string;
  alert: boolean;
}

const MOOD_CONFIG: Record<Mood, { icon: string; color: string; label: string }> = {
  happy:    { icon: '😊', color: '#22c55e', label: 'Gelukkig' },
  sad:      { icon: '😢', color: '#3b82f6', label: 'Hartseer' },
  neutral:  { icon: '😐', color: '#94a3b8', label: 'Neutraal' },
  pain:     { icon: '😣', color: '#ef4444', label: 'Pyn' },
  anxious:  { icon: '😰', color: '#f59e0b', label: 'Angstig' },
  confused: { icon: '😕', color: '#8b5cf6', label: 'Verward' },
  unknown:  { icon: '🤔', color: '#64748b', label: 'Onbekend' },
};

export default function FacialMoodScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<MoodResult | null>(null);
  const [history, setHistory] = useState<(MoodResult & { time: string })[]>([]);

  const scan = useCallback(async () => {
    if (!cameraRef.current || scanning) return;
    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true, quality: 0.6, skipProcessing: true,
      });
      if (!photo?.base64) throw new Error('No image captured');

      const { data } = await api.post('/mood/analyze', { imageBase64: photo.base64 });
      const moodResult: MoodResult = data;
      setResult(moodResult);
      setHistory(prev => [{ ...moodResult, time: new Date().toLocaleTimeString('af-ZA') }, ...prev.slice(0, 9)]);

      // Auto-alert for pain or extreme distress
      if (moodResult.alert) {
        Alert.alert(
          '⚠️ ' + t('moodAlertTitle'),
          moodResult.recommendation,
          [
            { text: t('dismiss'), style: 'cancel' },
            { text: t('sosActivate'), style: 'destructive', onPress: () => router.push('/sos-active') },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert(t('error'), err?.response?.data?.error || t('moodScanFailed'));
    } finally { setScanning(false); }
  }, [scanning]);

  if (!permission) return <ActivityIndicator style={{ flex: 1 }} color={Colors.accent} />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title={t('moodTitle')} onBack={() => router.back()} />
        <View style={styles.permCenter}>
          <Ionicons name="camera-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.permText}>{t('cameraPermRequired')}</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>{t('grantPermission')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const moodCfg = result ? MOOD_CONFIG[result.mood] : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('moodTitle')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Camera */}
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            <View style={styles.cameraOverlay}>
              <View style={styles.faceGuide} />
            </View>
          </CameraView>
          <TouchableOpacity style={styles.flipBtn} onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}>
            <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Scan button */}
        <TouchableOpacity style={[styles.scanBtn, scanning && styles.scanBtnDisabled]} onPress={scan} disabled={scanning}>
          {scanning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="scan-outline" size={22} color="#fff" />
              <Text style={styles.scanBtnText}>{t('moodScan')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Result */}
        {result && moodCfg && (
          <PlatinumCard style={[styles.resultCard, { borderColor: moodCfg.color }]}>
            <View style={styles.resultHeader}>
              <Text style={styles.moodEmoji}>{moodCfg.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.moodLabel, { color: moodCfg.color }]}>{moodCfg.label}</Text>
                <Text style={styles.confidence}>{Math.round(result.confidence * 100)}% {t('confidence')}</Text>
              </View>
              {result.alert && <Badge label="⚠️ Alert" color={Colors.error} />}
            </View>
            <Text style={styles.description}>{result.description}</Text>
            {result.recommendation && (
              <View style={[styles.recBox, { borderLeftColor: moodCfg.color }]}>
                <Text style={styles.recText}>{result.recommendation}</Text>
              </View>
            )}
          </PlatinumCard>
        )}

        {/* History */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>{t('moodHistory')}</Text>
            {history.map((h, i) => {
              const cfg = MOOD_CONFIG[h.mood];
              return (
                <View key={i} style={styles.historyRow}>
                  <Text style={styles.historyEmoji}>{cfg.icon}</Text>
                  <Text style={[styles.historyMood, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={styles.historyTime}>{h.time}</Text>
                  <Text style={styles.historyConf}>{Math.round(h.confidence * 100)}%</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  cameraContainer: { height: 320, position: 'relative', margin: Spacing.md, borderRadius: Radius.lg, overflow: 'hidden' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  faceGuide: {
    width: 180, height: 220, borderRadius: 90,
    borderWidth: 2, borderColor: 'rgba(99,102,241,0.7)',
    borderStyle: 'dashed',
  },
  flipBtn: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: Radius.full,
    padding: 10,
  },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    marginHorizontal: Spacing.md, paddingVertical: 14,
    ...Shadow.glow,
  },
  scanBtnDisabled: { opacity: 0.6 },
  scanBtnText: { color: '#fff', ...Typography.labelMd, fontWeight: '700' },
  resultCard: { margin: Spacing.md, padding: Spacing.md, borderWidth: 1.5 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.sm },
  moodEmoji: { fontSize: 40 },
  moodLabel: { ...Typography.titleSm, fontWeight: '800' },
  confidence: { ...Typography.labelSm, color: Colors.textMuted },
  description: { ...Typography.bodyMd, color: Colors.text, marginBottom: Spacing.sm },
  recBox: { borderLeftWidth: 3, paddingLeft: Spacing.sm, marginTop: 4 },
  recText: { ...Typography.labelSm, color: Colors.textMuted, fontStyle: 'italic' },
  historySection: { marginHorizontal: Spacing.md, marginTop: Spacing.sm },
  historyTitle: { ...Typography.labelMd, color: Colors.textMuted, marginBottom: 8, fontWeight: '700' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyEmoji: { fontSize: 20 },
  historyMood: { ...Typography.labelMd, flex: 1, fontWeight: '600' },
  historyTime: { ...Typography.labelSm, color: Colors.textMuted },
  historyConf: { ...Typography.labelSm, color: Colors.textMuted, width: 36, textAlign: 'right' },
  permCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: Spacing.xl },
  permText: { ...Typography.bodyMd, color: Colors.textMuted, textAlign: 'center' },
  permBtn: { backgroundColor: Colors.accent, borderRadius: Radius.full, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText: { color: '#fff', ...Typography.labelMd, fontWeight: '700' },
});
