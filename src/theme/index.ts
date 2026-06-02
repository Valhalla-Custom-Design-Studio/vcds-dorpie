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
  bg: '#0A0A0A',
  bgSecondary: '#111111',
  surface: 'rgba(255,255,255,0.05)',
  surfaceElevated: 'rgba(255,255,255,0.08)',
  surfaceHover: 'rgba(255,255,255,0.10)',
  surfaceBorder: 'rgba(255,255,255,0.08)',
  surfaceBorderStrong: 'rgba(255,255,255,0.18)',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.10)',
  textHeading: '#F5F0FF',
  textBody: '#C4B5D4',
  textMuted: '#8B7BA0',
  textOnAccent: '#0A0A0A',
  textOnPrimary: '#FFFFFF',
  tabBarBg: 'rgba(10,10,10,0.97)',
  tabActive: '#D4A017',
  tabInactive: '#8B7BA0',
  shimmerBase: '#1A0F2E',
  shimmerHighlight: '#2D1B4E',
  overlay: 'rgba(0,0,0,0.75)',
  overlayLight: 'rgba(0,0,0,0.4)',
  cardGradientStart: 'rgba(107,33,168,0.18)',
  cardGradientEnd: 'rgba(10,10,10,0.0)',
  sosRed: '#FF1744',
  sosRedDark: '#B71C1C',
  guardianGreen: '#00E676',
  guardianGreenDark: '#00C853',
  // Feature card accents (Noodgevalle / Safety)
  accentGreen: '#22C55E',
  accentRed: '#EF4444',
  accentPurple: '#A855F7',
  accentViolet: '#8B5CF6',
  accentYellow: '#EAB308',
  accentBlue: '#3B82F6',
  accentOrange: '#F97316',
  // Aliases for legacy screens
  text: '#F5F0FF',
  muted: '#8B7BA0',
  card: 'rgba(255,255,255,0.05)',
  textPrimary: '#F5F0FF',  // alias for textHeading — used in legacy screens
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
  bodySemi: { fontSize: 15, fontWeight: '600' as const, color: Colors.textHeading },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: Colors.textBody },
  caption: { fontSize: 11, fontWeight: '500' as const, color: Colors.textMuted, letterSpacing: 0.3 },
  label: { fontSize: 12, fontWeight: '600' as const, color: Colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  button: { fontSize: 15, fontWeight: '700' as const, color: Colors.textOnPrimary },
  mono: { fontSize: 13, fontFamily: 'monospace' as const, color: Colors.textBody },
};

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  glow: (color: string = Colors.primary) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 8,
  }),
  glowAccent: { shadowColor: Colors.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 },
  glowRed: { shadowColor: Colors.sosRed, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 16, elevation: 10 },
};
