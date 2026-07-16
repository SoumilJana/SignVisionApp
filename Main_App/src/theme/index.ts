/**
 * Design System Theme
 * Extracted from designs/code/profile_page.html and DESIGN_DOC.md
 */

export const COLORS = {
  // Primary Palette
  primary: '#1978e5',
  primaryDark: '#145db3',
  primaryLight: '#eff6ff',

  // Gradients
  gradientStart: '#4f46e5',
  gradientEnd: '#1978e5',

  // Neutrals
  background: '#f6f7f8',
  cardBg: '#ffffff',
  textMain: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  white: '#ffffff',
  black: '#000000',

  // Utility
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
};

export const DARK_COLORS = {
  // Primary Palette
  primary: '#1978e5', // Kept same for brand consistency
  primaryDark: '#145db3',
  primaryLight: 'rgba(25, 120, 229, 0.2)',

  // Gradients
  gradientStart: '#4f46e5',
  gradientEnd: '#1978e5',

  // Neutrals (Extracted from UI Designs)
  background: '#0F172A',
  cardBg: '#1E293B',
  textMain: '#F1F5F9',
  textMuted: '#94A3B8',
  border: '#334155',
  white: '#ffffff',
  black: '#000000',

  // Utility
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const SHADOWS = {
  soft: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  fab: {
    shadowColor: '#1978e5',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 30,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
};
