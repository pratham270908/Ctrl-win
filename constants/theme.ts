export const COLORS = {
  // ── Brand Backgrounds ──────────────────────────────────────
  background:    '#0A0F1E',   // Deep space navy
  backgroundAlt: '#0D1628',   // Slightly lighter for card surfaces
  surface:       '#111827',   // Card background
  surfaceHigh:   '#1A2540',   // Elevated card / panel
  surfaceGlass:  'rgba(26, 37, 64, 0.85)', // Glass panels
  border:        'rgba(99, 132, 255, 0.15)',
  borderBright:  'rgba(99, 132, 255, 0.35)',

  // ── Primary Accent — Cyan / Electric Blue ──────────────────
  accent:        '#4F8EF7',   // Electric blue primary
  accentCyan:    '#06B6D4',   // Cyan highlights
  accentGlow:    'rgba(79, 142, 247, 0.25)',
  accentLight:   'rgba(79, 142, 247, 0.12)',

  // ── Directional Status Colors ──────────────────────────────
  ahead:         '#22C55E',   // Bright green — AHEAD / forward
  aheadLight:    'rgba(34, 197, 94, 0.14)',
  aheadGlow:     'rgba(34, 197, 94, 0.3)',
  onRoute:       '#3B82F6',   // Blue — ON ROUTE / minimal deviation
  onRouteLight:  'rgba(59, 130, 246, 0.14)',
  behind:        '#F59E0B',   // Amber — BEHIND / requires backtrack
  behindLight:   'rgba(245, 158, 11, 0.14)',

  // ── Semantic ───────────────────────────────────────────────
  danger:        '#EF4444',
  dangerLight:   'rgba(239, 68, 68, 0.14)',
  success:       '#22C55E',
  warning:       '#F59E0B',
  warningLight:  'rgba(245, 158, 11, 0.14)',
  info:          '#4F8EF7',

  // ── Orange Category Highlights ─────────────────────────────
  orange:        '#F97316',
  orangeLight:   'rgba(249, 115, 22, 0.14)',

  // ── Typography ─────────────────────────────────────────────
  textPrimary:   '#F0F4FF',   // Near-white
  textSecondary: '#8B9FC4',   // Blue-grey muted
  textMuted:     '#4B5D7E',   // Very muted
  textInverse:   '#0A0F1E',

  // ── Map Elements ───────────────────────────────────────────
  mapBg:         '#0D1628',
  mapGrid:       'rgba(79, 142, 247, 0.06)',
  mapRoad:       '#1E2D4A',
  mapRoadBorder: '#243350',
  mapHighway:    '#1A3A6E',
  mapRoute:      '#4F8EF7',
  mapRouteAhead: '#22C55E',
  mapUserPulse:  'rgba(79, 142, 247, 0.2)',

  // ── Navigation Bar ─────────────────────────────────────────
  navBg:         '#0D1628',
  navBorder:     'rgba(79, 142, 247, 0.12)',
  navActive:     '#4F8EF7',
  navInactive:   '#4B5D7E',

  // ── Overlays ───────────────────────────────────────────────
  overlay:       'rgba(10, 15, 30, 0.7)',
  shadow:        '#000000',

  // ── Legacy aliases (keeps existing code compatible) ────────
  primary:       '#1A2540',
  primaryDark:   '#0D1628',
  primaryLight:  '#243350',
  cardBg:        '#111827',
  cardBorder:    'rgba(99, 132, 255, 0.15)',
  surfaceLight:  '#1A2540',
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 12,
  },
  glow: {
    shadowColor: '#4F8EF7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
};
