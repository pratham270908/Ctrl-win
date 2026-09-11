export const COLORS = {
  // Brand & Accents
  primary: '#1E293B', // Deep Navy
  primaryDark: '#0F172A',
  primaryLight: '#334155',
  accent: '#6366F1', // Indigo / Purple
  accentLight: '#EEF2FF',
  
  // Directional & Status Colors
  ahead: '#10B981', // Emerald Green - AHEAD / Forward
  aheadLight: '#ECFDF5',
  onRoute: '#3B82F6', // Blue - ON YOUR ROUTE / Minimal deviation
  onRouteLight: '#EFF6FF',
  behind: '#F59E0B', // Amber / Warning - BEHIND / Requires turning back
  behindLight: '#FFFBEB',
  
  // Semantic
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Neutrals & Surfaces
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  surfaceLight: '#F1F5F9',
  
  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  
  // Map Elements
  mapBg: '#E8EDF2',
  mapRoad: '#FFFFFF',
  mapRoadBorder: '#CBD5E1',
  mapHighway: '#FDE68A',
  mapRoute: '#3B82F6',
  mapRouteAhead: '#10B981',
  mapUserPulse: 'rgba(59, 130, 246, 0.25)',
  
  // Overlay & Shadows
  overlay: 'rgba(15, 23, 42, 0.5)',
  shadow: '#0F172A',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
