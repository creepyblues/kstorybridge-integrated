/**
 * KStoryBridge Brand Color Palette
 * 
 * This file defines the official color palette for the KStoryBridge brand
 * to ensure consistency across all applications (website and dashboard).
 */

export const kstoryColors = {
  // Primary Brand Colors
  'hanok-teal': {
    DEFAULT: '#4C9C9B',
    50: '#E8F5F5',
    100: '#D1EAEA', 
    200: '#A3D5D4',
    300: '#75C0BF',
    400: '#4C9C9B',
    500: '#3D7D7C',
    600: '#2E5E5D',
    700: '#1F3F3E',
    800: '#0F1F1F',
    900: '#000000',
  },
  
  'midnight-ink': {
    DEFAULT: '#1C1C1C',
    50: '#F5F5F5',
    100: '#EBEBEB',
    200: '#D7D7D7', 
    300: '#C3C3C3',
    400: '#AFAFAF',
    500: '#9B9B9B',
    600: '#878787',
    700: '#737373',
    800: '#5F5F5F',
    900: '#1C1C1C',
  },
  
  // Supporting Colors
  'snow-white': {
    DEFAULT: '#FFFFFF',
  },
  
  'porcelain-blue': {
    DEFAULT: '#C3E3E2',
    50: '#F1F9F9',
    100: '#E3F3F2',
    200: '#C3E3E2',
    300: '#A3D3D2',
    400: '#83C3C2',
    500: '#63B3B2',
    600: '#43A3A2',
    700: '#239392',
    800: '#038382',
    900: '#027372',
  },
  
  'sunrise-coral': {
    DEFAULT: '#FF6B6B',
    50: '#FFF0F0',
    100: '#FFE1E1',
    200: '#FFC3C3',
    300: '#FFA5A5',
    400: '#FF8787',
    500: '#FF6B6B',
    600: '#FF4D4D',
    700: '#FF2F2F',
    800: '#FF1111',
    900: '#F00000',
  },
  
  'warm-sand': {
    DEFAULT: '#F5E9D7',
    50: '#FEFCF9',
    100: '#FDF9F3',
    200: '#F9F1E3',
    300: '#F5E9D7',
    400: '#F1E1CB',
    500: '#EDD9BF',
    600: '#E9D1B3',
    700: '#E5C9A7',
    800: '#E1C19B',
    900: '#DDB98F',
  },
} as const;

// Semantic color mappings for easier usage
export const semanticColors = {
  primary: kstoryColors['hanok-teal'],
  text: kstoryColors['midnight-ink'],
  background: kstoryColors['snow-white'],
  accent: kstoryColors['porcelain-blue'],
  cta: kstoryColors['sunrise-coral'], // Call-to-Action
  neutral: kstoryColors['warm-sand'],
} as const;

// CSS custom properties generator
export const generateCSSVariables = (colors: typeof kstoryColors) => {
  const variables: Record<string, string> = {};
  
  Object.entries(colors).forEach(([colorName, colorValue]) => {
    if (typeof colorValue === 'string') {
      variables[`--color-${colorName}`] = colorValue;
    } else {
      Object.entries(colorValue).forEach(([shade, value]) => {
        const variableName = shade === 'DEFAULT' 
          ? `--color-${colorName}` 
          : `--color-${colorName}-${shade}`;
        variables[variableName] = value;
      });
    }
  });
  
  return variables;
};

// Export for Tailwind configuration
export const tailwindColors = {
  'hanok-teal': kstoryColors['hanok-teal'],
  'midnight-ink': kstoryColors['midnight-ink'],
  'snow-white': kstoryColors['snow-white'],
  'porcelain-blue': kstoryColors['porcelain-blue'],
  'sunrise-coral': kstoryColors['sunrise-coral'],
  'warm-sand': kstoryColors['warm-sand'],
  
  // Semantic aliases
  'brand-primary': kstoryColors['hanok-teal'],
  'brand-text': kstoryColors['midnight-ink'],
  'brand-background': kstoryColors['snow-white'],
  'brand-accent': kstoryColors['porcelain-blue'],
  'brand-cta': kstoryColors['sunrise-coral'],
  'brand-neutral': kstoryColors['warm-sand'],
} as const;