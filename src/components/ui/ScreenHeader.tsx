import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, showBack = false, right }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.wrap, { paddingTop: insets.top + 8 }]}>
      <View style={s.row}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={s.back}>
            <Ionicons name="chevron-back" size={24} color={Colors.textHeading} />
          </TouchableOpacity>
        ) : <View style={s.placeholder} />}
        <View style={s.center}>
          <Text style={Typography.h2} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={[Typography.caption, { textAlign: 'center' }]}>{subtitle}</Text> : null}
        </View>
        <View style={s.placeholder}>{right}</View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: Colors.bg, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  row: { flexDirection: 'row', alignItems: 'center' },
  back: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center' },
  placeholder: { width: 40 },
});
