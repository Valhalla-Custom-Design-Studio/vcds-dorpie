import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Radius, Spacing } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function PlatinumInput({ label, error, isPassword, icon, style, ...props }: Props) {
  const [show, setShow] = useState(false);
  return (
    <View style={s.wrapper}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View style={[s.row, error ? s.errBorder : null]}>
        {icon ? <Ionicons name={icon} size={18} color={Colors.textMuted} style={s.icon} /> : null}
        <TextInput
          style={[s.input, style]}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword && !show}
          autoCapitalize="none"
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setShow(!show)} style={s.eye}>
            <Ionicons name={show ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={s.err}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 13, color: Colors.textMuted, marginBottom: 6, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, color: Colors.textHeading, fontSize: 16 },
  eye: { padding: 4 },
  errBorder: { borderColor: Colors.red },
  err: { color: Colors.red, fontSize: 12, marginTop: 4 },
});
