import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/theme';
import { ScreenHeader, PlatinumCard } from '@/components/ui';

const LANGUAGES = [
  { code: 'af', label: 'Afrikaans', flag: '🇿🇦', desc: 'Dorpwag™ in Afrikaans' },
  { code: 'en', label: 'English', flag: '🇬🇧', desc: 'Dorpwag™ in English' },
];

export default function LanguageSettings() {
  const [selected, setSelected] = useState('af');

  const choose = async (code: string) => {
    setSelected(code);
    await AsyncStorage.setItem('app_language', code);
  };

  return (
    <View style={s.container}>
      <ScreenHeader title="Taal / Language" showBack />
      <ScrollView contentContainerStyle={s.scroll}>
        <PlatinumCard style={s.card}>
          {LANGUAGES.map((lang, i) => (
            <TouchableOpacity
              key={lang.code}
              style={[s.item, i < LANGUAGES.length - 1 && s.border]}
              onPress={() => choose(lang.code)}
            >
              <Text style={{ fontSize: 32 }}>{lang.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={Typography.h4}>{lang.label}</Text>
                <Text style={Typography.caption}>{lang.desc}</Text>
              </View>
              {selected === lang.code && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </PlatinumCard>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md },
  card: { padding: 0, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 16 },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
});
