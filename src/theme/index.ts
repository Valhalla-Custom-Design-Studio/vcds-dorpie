export const Colors = {
  primary: '#6B21A8',
  primaryLight: '#7C3AED',
  primaryDark: '#4C1D95',
  accent: '#D4A017',
  accentLight: '#F59E0B',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  red: '#DC2626',
  bg: '#0B0612',
  bgSecondary: '#110920',
  surface: 'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(255,255,255,0.10)',
  surfaceBorder: 'rgba(255,255,255,0.10)',
  surfaceBorderStrong: 'rgba(255,255,255,0.20)',
  textHeading: '#F5F0FF',
  textBody: '#C4B5D4',
  textMuted: '#8B7BA0',
  textOnAccent: '#0B0612',
  textOnPrimary: '#FFFFFF',
  tabBarBg: 'rgba(11,6,18,0.95)',
  tabActive: '#D4A017',
  tabInactive: '#8B7BA0',
  shimmerBase: '#1A0F2E',
  shimmerHighlight: '#2D1B4E',
  overlay: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(0,0,0,0.4)',
  cardGradientStart: 'rgba(107,33,168,0.15)',
  cardGradientEnd: 'rgba(11,6,18,0.0)',
  sosRed: '#FF1744',
  sosRedDark: '#B71C1C',
  guardianGreen: '#00E676',
  guardianGreenDark: '#00C853',
  // Aliases for legacy screens
  text: '#F5F0FF',
  muted: '#8B7BA0',
  card: 'rgba(255,255,255,0.06)',
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
};

export const Typography = {
  h1: { fontSize: 32, fontWeight: '800' as const, color: Colors.textHeading, letterSpacing: -0.5 },
  h2: { fontSize: 26, fontWeight: '700' as const, color: Colors.textHeading, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '700' as const, color: Colors.textHeading },
  h4: { fontSize: 17, fontWeight: '600' as const, color: Colors.textHeading },
  body: { fontSize: 15, fontWeight: '400' as const, color: Colors.textBody, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: Colors.textBody },
  caption: { fontSize: 11, fontWeight: '500' as const, color: Colors.textMuted, letterSpacing: 0.3 },
  label: { fontSize: 12, fontWeight: '600' as const, color: Colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  mono: { fontSize: 13, fontFamily: 'monospace' as const, color: Colors.textBody },
};

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
  glow: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 8 },
  glowAccent: { shadowColor: Colors.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 },
  glowRed: { shadowColor: Colors.sosRed, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 16, elevation: 10 },
};
