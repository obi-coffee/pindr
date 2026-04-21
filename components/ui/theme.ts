// Authoritative design tokens for Pindr. Tailwind mirrors these values in
// tailwind.config.js; keep them in sync. See ../../Design-System-Brief.md.

import type { TextStyle, ViewStyle } from 'react-native';

export const lightColors = {
  paper: '#EDE9E1',
  'paper-raised': '#F6F3EC',
  'paper-high': '#FBF9F3',

  ink: '#0E0E0C',
  'ink-soft': '#5D5852',
  'ink-subtle': '#9A9189',

  moss: '#1F2A21',
  'moss-soft': '#3D4E3F',

  taupe: '#8B6B5F',
  clay: '#7A4C3D',

  mustard: '#D6A640',
  burgundy: '#6B1B24',
  stone: '#B8B2A5',

  success: '#2F5A3A',
  warning: '#C4903B',
  danger: '#6B1B24',

  stroke: '#D8D3C7',
  'stroke-strong': '#B9B2A4',
} as const;

// Dark palette: deep moss-tinted background, warm paper text. Accents
// (moss, burgundy, mustard) are lifted in luminance so they read against
// the dark background. Stroke and stone become muted moss.
export const darkColors: Record<keyof typeof lightColors, string> = {
  paper: '#141A15',
  'paper-raised': '#1C231D',
  'paper-high': '#242C25',

  ink: '#F5EFE2',
  'ink-soft': '#B8B2A5',
  'ink-subtle': '#7F7A70',

  moss: '#B5C9AF',
  'moss-soft': '#7A9580',

  taupe: '#C2A090',
  clay: '#D68E77',

  mustard: '#E8BE63',
  burgundy: '#D27179',
  stone: '#3A423B',

  success: '#7AB089',
  warning: '#E8BE63',
  danger: '#D27179',

  stroke: '#2E352F',
  'stroke-strong': '#40483F',
};

export type ColorToken = keyof typeof lightColors;
export type Palette = Record<ColorToken, string>;

// Backward-compatible static export. Non-theme-aware imports (`import { colors }`)
// keep rendering as light. Phase 2 migrates the rest of the app onto useTheme().
export const colors: Palette = lightColors;

export const radii = {
  sm: 4,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

// 4-based spacing scale in points.
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const shadows: Record<'sm' | 'md', ViewStyle> = {
  sm: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
};

// Inter fonts are loaded via @expo-google-fonts/inter in app/_layout.tsx.
// React Native needs the exact family per weight; default fontWeight alone
// is not enough with a custom font.
type InterWeight = '400' | '500' | '600' | '700' | '800' | '900';

export const fontFamilyForWeight: Record<InterWeight, string> = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  '800': 'Inter_800ExtraBold',
  '900': 'Inter_900Black',
};

export function fontFamilyFor(weight: TextStyle['fontWeight'] | undefined): string {
  if (weight && weight in fontFamilyForWeight) {
    return fontFamilyForWeight[weight as InterWeight];
  }
  return 'Inter_400Regular';
}

// Type scale. Core variants from §4 plus card-specific variants (§6.1,
// type scale Option A: HTML card spec wins over the general scale). All
// values in points.
export const typography = {
  // Core
  'display-xl': {
    fontSize: 56,
    lineHeight: 54,
    fontWeight: '900',
    letterSpacing: -0.56,
    textTransform: 'uppercase',
  },
  'display-lg': {
    fontSize: 40,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -0.4,
    textTransform: 'uppercase',
  },
  h1: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '500',
    letterSpacing: -0.32,
  },
  h2: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '500',
    letterSpacing: -0.12,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  'body-lg': {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '400',
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  'body-sm': {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.54, // 0.14em × 11px
    textTransform: 'uppercase',
  },

  // Card-specific (§6.1)
  'card-name': {
    fontSize: 26,
    lineHeight: 29,
    fontWeight: '700',
    letterSpacing: -0.26,
  },
  'card-distance': {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  'card-meta': {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  'card-stat-label': {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  'card-stat-value': {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '600',
  },
  'card-prompt-label': {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  'card-prompt-body': {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '500',
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
