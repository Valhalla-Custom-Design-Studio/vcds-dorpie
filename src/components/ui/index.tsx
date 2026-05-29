import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
  TextInput, ViewStyle, TextStyle, Animated, Pressable, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadow } from '../../theme';

// ─── GlassCard ──────────────────────────────────────────────
export function GlassCard({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.85} style={[styles.glassCard, style]}>
      {children}
    </Wrapper>
  );
}

// ─── PlatinumCard ───────────────────────────────────────────
export function PlatinumCard({ children, style, onPress, accent }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; accent?: boolean }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.85} style={[styles.platinumCard, accent && styles.platinumCardAccent, style]}>
      {children}
    </Wrapper>
  );
}

// ─── PrimaryButton ──────────────────────────────────────────
export function PrimaryButton({ title, onPress, loading, disabled, style, icon, variant = 'primary' }: {
  title: string; onPress: () => void; loading?: boolean; disabled?: boolean;
  style?: ViewStyle; icon?: keyof typeof Ionicons.glyphMap; variant?: 'primary' | 'accent' | 'danger' | 'ghost' | 'outline';
}) {
  const bgColor = variant === 'accent' ? Colors.accent : variant === 'danger' ? Colors.error : variant === 'ghost' ? 'transparent' : variant === 'outline' ? 'transparent' : Colors.primary;
  const borderColor = variant === 'outline' ? Colors.surfaceBorderStrong : 'transparent';
  const textColor = variant === 'accent' ? Colors.textOnAccent : variant === 'ghost' ? Colors.textBody : Colors.textOnPrimary;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.primaryBtn, { backgroundColor: bgColor, borderColor, borderWidth: variant === 'outline' ? 1 : 0 }, (disabled || loading) && styles.btnDisabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.btnRow}>
          {icon && <Ionicons name={icon} size={18} color={textColor} style={{ marginRight: 6 }} />}
          <Text style={[styles.primaryBtnText, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── SOSButton ──────────────────────────────────────────────
export function SOSButton({ onPress, active }: { onPress: () => void; active?: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [active]);
  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.sosBtn, active && styles.sosBtnActive]}>
        <Ionicons name="warning" size={36} color="#FFFFFF" />
        <Text style={styles.sosBtnText}>{active ? 'SOS AKTIEF' : 'SOS'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Badge ──────────────────────────────────────────────────
export function Badge({ label, color, style }: { label: string; color?: string; style?: ViewStyle }) {
  return (
    <View style={[styles.badge, { backgroundColor: color || Colors.primary }, style]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

// ─── SeverityBadge ──────────────────────────────────────────
export function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: Colors.sosRed, high: Colors.error, medium: Colors.warning, low: Colors.success
  };
  const labels: Record<string, string> = {
    critical: 'KRITIEK', high: 'HOOG', medium: 'MEDIUM', low: 'LAAG'
  };
  return <Badge label={labels[severity] || severity.toUpperCase()} color={colors[severity] || Colors.textMuted} />;
}

// ─── InputField ─────────────────────────────────────────────
export function InputField({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, error, icon, style }: {
  label?: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
  secureTextEntry?: boolean; keyboardType?: any; multiline?: boolean; error?: string;
  icon?: keyof typeof Ionicons.glyphMap; style?: ViewStyle;
}) {
  return (
    <View style={[styles.inputWrapper, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {icon && <Ionicons name={icon} size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[styles.input, multiline && { height: 100, textAlignVertical: 'top' }]}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ─── Avatar ─────────────────────────────────────────────────
export function Avatar({ name, size = 40, uri, style }: { name: string; size?: number; uri?: string; style?: ViewStyle }) {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

// ─── EmptyState ─────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action, actionLabel }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; action?: () => void; actionLabel?: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={56} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {action && actionLabel && (
        <PrimaryButton title={actionLabel} onPress={action} style={{ marginTop: Spacing.md }} />
      )}
    </View>
  );
}

// ─── LoadingScreen ──────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}

// ─── SectionHeader ──────────────────────────────────────────
export function SectionHeader({ title, action, actionLabel }: { title: string; action?: () => void; actionLabel?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && actionLabel && (
        <TouchableOpacity onPress={action}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Divider ────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ─── StatusDot ──────────────────────────────────────────────
export function StatusDot({ active, size = 10 }: { active: boolean; size?: number }) {
  return (
    <View style={[styles.statusDot, { width: size, height: size, borderRadius: size / 2, backgroundColor: active ? Colors.success : Colors.textMuted }]} />
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  platinumCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    ...Shadow.md,
  },
  platinumCardAccent: {
    borderColor: Colors.accent,
    ...Shadow.glowAccent,
  },
  primaryBtn: {
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  btnDisabled: { opacity: 0.5 },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  primaryBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  sosBtn: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.sosRed,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.glowRed,
  },
  sosBtnActive: { backgroundColor: Colors.sosRedDark },
  sosBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14, marginTop: 4, letterSpacing: 1 },
  badge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  inputWrapper: { marginBottom: Spacing.md },
  inputLabel: { ...Typography.label, marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  inputError: { borderColor: Colors.error },
  input: { flex: 1, color: Colors.textHeading, fontSize: 15 },
  errorText: { color: Colors.error, fontSize: 12, marginTop: 4 },
  avatar: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
  emptyTitle: { ...Typography.h4, marginTop: Spacing.md, textAlign: 'center' },
  emptySubtitle: { ...Typography.body, textAlign: 'center', marginTop: Spacing.sm, color: Colors.textMuted },
  loadingScreen: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.h4 },
  sectionAction: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: Spacing.sm },
  statusDot: {},
});
