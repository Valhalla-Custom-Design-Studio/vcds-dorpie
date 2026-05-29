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
export function PlatinumCard({
  children, style, onPress, accent, accentColor,
}: {
  children: React.ReactNode; style?: ViewStyle; onPress?: () => void;
  accent?: boolean; accentColor?: string;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  const glowStyle = accentColor ? Shadow.glow(accentColor) : {};
  const borderStyle = accentColor ? { borderColor: accentColor + '33' } : {};
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.platinumCard, accent && styles.platinumCardAccent, borderStyle, glowStyle, style]}
    >
      {children}
    </Wrapper>
  );
}

// ─── FeatureCard ─────────────────────────────────────────────
// Premium card for Noodgevalle / Safety feature tiles
export function FeatureCard({
  children, style, onPress, accentColor,
}: {
  children: React.ReactNode; style?: ViewStyle; onPress?: () => void; accentColor: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[
        styles.featureCard,
        {
          borderColor: accentColor + '28',
          ...Shadow.glow(accentColor),
        },
        style,
      ]}
    >
      {children}
    </TouchableOpacity>
  );
}

// ─── FeatureIconBadge ────────────────────────────────────────
export function FeatureIconBadge({ icon, color, size = 24 }: { icon: keyof typeof Ionicons.glyphMap; color: string; size?: number }) {
  return (
    <View style={[styles.featureIconWrap, { backgroundColor: color + '22', ...Shadow.glow(color) }]}>
      <Ionicons name={icon} size={size} color={color} />
    </View>
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
  const glowStyle = variant === 'primary' ? Shadow.glow(Colors.primary) : variant === 'accent' ? Shadow.glow(Colors.accent) : {};
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.primaryBtn, { backgroundColor: bgColor, borderColor, borderWidth: variant === 'outline' ? 1 : 0 }, (disabled || loading) && styles.btnDisabled, glowStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.btnRow}>
          {icon && <Ionicons name={icon} size={18} color={textColor} style={{ marginRight: 6 }} />}
          <Text style={[Typography.button, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── SOSButton ───────────────────────────────────────────────
export function SOSButton({ onPress, label = 'SOS' }: { onPress: () => void; label?: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <TouchableOpacity onPress={onPress} style={styles.sosBtn} activeOpacity={0.85}>
        <Ionicons name="warning" size={28} color="#fff" />
        <Text style={styles.sosBtnText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Badge ───────────────────────────────────────────────────
export function Badge({ label, variant = 'primary' }: { label: string; variant?: 'primary' | 'success' | 'warning' | 'error' | 'muted' | 'accent' }) {
  const bg = variant === 'success' ? Colors.success
    : variant === 'warning' ? Colors.warning
    : variant === 'error' ? Colors.red
    : variant === 'muted' ? Colors.surface
    : variant === 'accent' ? Colors.accent
    : Colors.primary;
  const textColor = variant === 'accent' ? Colors.textOnAccent : '#fff';
  return <View style={[styles.badge, { backgroundColor: bg }]}><Text style={[styles.badgeText, { color: textColor }]}>{label}</Text></View>;
}

// ─── SeverityBadge ───────────────────────────────────────────
export function SeverityBadge({ level }: { level: 'low' | 'medium' | 'high' | 'critical' }) {
  const map = { low: Colors.success, medium: Colors.warning, high: Colors.error, critical: Colors.sosRed };
  return <Badge label={level.toUpperCase()} variant={level === 'low' ? 'success' : level === 'medium' ? 'warning' : 'error'} />;
}

// ─── InputField ──────────────────────────────────────────────
export function InputField({ label, value, onChangeText, placeholder, secureTextEntry, multiline, style, keyboardType, autoCapitalize }: {
  label?: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
  secureTextEntry?: boolean; multiline?: boolean; style?: ViewStyle; keyboardType?: any; autoCapitalize?: any;
}) {
  return (
    <View style={[styles.inputWrap, style]}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, multiline && { height: 100, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

// ─── Avatar ──────────────────────────────────────────────────
export function Avatar({ name, size = 40, color }: { name: string; size?: number; color?: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const bg = color || Colors.primary;
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

// ─── EmptyState ──────────────────────────────────────────────
export function EmptyState({ icon = 'folder-open-outline', title, subtitle, actionLabel, onAction }: {
  icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={icon} size={48} color={Colors.textMuted} />
      </View>
      <Text style={[Typography.h3, { textAlign: 'center', marginTop: 16 }]}>{title}</Text>
      {subtitle ? <Text style={[Typography.body, { textAlign: 'center', marginTop: 8, color: Colors.textMuted }]}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── LoadingScreen ───────────────────────────────────────────
export function LoadingScreen() {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}

// ─── SectionHeader ───────────────────────────────────────────
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
      {action && onAction ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionHeaderAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ─── Divider ─────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ─── StatusDot ───────────────────────────────────────────────
export function StatusDot({ active }: { active: boolean }) {
  return <View style={[styles.statusDot, { backgroundColor: active ? Colors.success : Colors.textMuted }]} />;
}

// ─── FilterPills ─────────────────────────────────────────────
export function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.filterPill,
        active && styles.filterPillActive,
        active && Shadow.glow(Colors.primary),
      ]}
    >
      <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: Colors.glass,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: Spacing.md,
    ...Shadow.md,
  },
  platinumCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  platinumCardAccent: {
    borderColor: Colors.primaryLight + '44',
    backgroundColor: Colors.cardGradientStart,
  },
  featureCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.md,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radius.lg,
    minHeight: 52,
  },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  sosBtn: {
    backgroundColor: Colors.sosRed,
    borderRadius: Radius.full,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.glowRed,
  },
  sosBtnText: { color: '#fff', fontWeight: '800', fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  inputWrap: { marginBottom: Spacing.md },
  inputLabel: { ...Typography.label, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textHeading,
    fontSize: 15,
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, minHeight: 300 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: Radius.lg,
    ...Shadow.glow(Colors.primary),
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm, marginTop: Spacing.md },
  sectionHeaderText: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' },
  sectionHeaderAction: { fontSize: 13, fontWeight: '600', color: Colors.accent },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginVertical: Spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginRight: Spacing.sm,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  filterPillText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  filterPillTextActive: { color: '#fff' },
});
