/**
 * KStoryBridge Design System - Essential Color Palette
 *
 * Streamlined color palette with essential shades (100, 300, 500, 700, 900)
 * for optimal performance and maintainability across dashboards.
 */

export const essentialColors = {
  // Primary Brand Colors
  'hanok-teal': {
    DEFAULT: '#4C9C9B',
    100: '#D1EAEA',
    300: '#75C0BF',
    500: '#3D7D7C',
    700: '#1F3F3E',
    900: '#000000',
  },

  'midnight-ink': {
    DEFAULT: '#1C1C1C',
    100: '#EBEBEB',
    300: '#C3C3C3',
    500: '#9B9B9B',
    700: '#737373',
    900: '#1C1C1C',
  },

  // Tier System
  'pro-purple': {
    DEFAULT: '#AF52DE',
    100: '#F3E5FF',
    300: '#D9A8FF',
    500: '#AF52DE',
    700: '#8B2FC9',
    900: '#5A1B85',
  },

  // Supporting Colors
  'porcelain-blue': {
    DEFAULT: '#C3E3E2',
    100: '#E3F3F2',
    300: '#A3D3D2',
    500: '#63B3B2',
    700: '#239392',
    900: '#027372',
  },

  'sunrise-coral': {
    DEFAULT: '#FF6B6B',
    100: '#FFE1E1',
    300: '#FFA5A5',
    500: '#FF6B6B',
    700: '#FF2F2F',
    900: '#F00000',
  },

  'warm-sand': {
    DEFAULT: '#F5E9D7',
    100: '#FDF9F3',
    300: '#F5E9D7',
    500: '#EDD9BF',
    700: '#E5C9A7',
    900: '#DDB98F',
  },
} as const;

// Semantic color mappings
export const semanticColors = {
  primary: essentialColors['hanok-teal'],
  text: essentialColors['midnight-ink'],
  accent: essentialColors['porcelain-blue'],
  cta: essentialColors['sunrise-coral'],
  neutral: essentialColors['warm-sand'],
  tier: essentialColors['pro-purple'],
} as const;

// Format-specific color mappings for title cards
export const formatColors = {
  webtoon: essentialColors['hanok-teal'],
  webNovel: essentialColors['porcelain-blue'],
  novel: essentialColors['warm-sand'],
  script: essentialColors['pro-purple'],
  default: essentialColors['midnight-ink'],
} as const;

// Export for Tailwind configuration
export const tailwindColors = {
  'hanok-teal': essentialColors['hanok-teal'],
  'midnight-ink': essentialColors['midnight-ink'],
  'pro-purple': essentialColors['pro-purple'],
  'porcelain-blue': essentialColors['porcelain-blue'],
  'sunrise-coral': essentialColors['sunrise-coral'],
  'warm-sand': essentialColors['warm-sand'],
} as const;
