import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Colors, Typography } from '@/theme';
import { PlatinumButton, PlatinumCard } from '@/components/ui';
import { movementAPI } from '@/services/api';

const STATUSES = ['Safe', 'At Home', 'Travelling', 'At Work', 'Out Walking', 'Patrol'];

export default function MovementCheckin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState('Safe');
  const [loading, setLoading] = useState(false);

  const checkin = async () => {
    setLoading(true);
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') { Alert.alert('Location permission required'); return; }
      const loc = await Location.getCurrentPositionAsync({});
      await movementAPI.checkin(loc.coords.latitude, loc.coords.longitude, status);
      Alert.alert('✅ Check-in recorded!', `Status: ${status}`);
      router.back();
    } catch { Alert.alert('Check-in failed. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>
      <TouchableOpacity onPress={() => router.back()} style={s.close}>
        <Ionicons name="close" size={24} color={Colors.textHeading} />
      </TouchableOpacity>
      <View style={s.content}>
        <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}>📍</Text>
        <Text style={[Typography.display, { textAlign: 'center' }]}>Movement Check-In</Text>
        <Text style={[Typography.body, { color: Colors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 32 }]}>
          Let your community know you're safe
        </Text>
        <PlatinumCard>
          <Text style={[Typography.caption, { color: Colors.textMuted, marginBottom: 8 }]}>STATUS</Text>
          <View style={s.pickerBox}>
            <Picker selectedValue={status} onValueChange={setStatus} style={{ color: Colors.textHeading }} dropdownIconColor={Colors.textMuted}>
              {STATUSES.map(s => <Picker.Item key={s} label={s} value={s} />)}
            </Picker>
          </View>
        </PlatinumCard>
        <PlatinumButton label="Check In Now" onPress={checkin} loading={loading} style={{ marginTop: 24 }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 24 },
  close: { alignSelf: 'flex-end', padding: 8 },
  content: { flex: 1, justifyContent: 'center' },
  pickerBox: { backgroundColor: Colors.shimmerBase, borderRadius: 10, overflow: 'hidden' },
});
