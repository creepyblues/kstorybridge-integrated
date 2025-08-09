/**
 * KStoryBridge Design System Tokens
 * Central source of truth for all design decisions
 */

// Typography Scale
export const typography = {
  // Font Families
  fonts: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
  },

  // Font Weights
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Font Sizes (mobile-first responsive)
  sizes: {
    xs: { mobile: '0.75rem', desktop: '0.75rem' },    // 12px
    sm: { mobile: '0.875rem', desktop: '0.875rem' },  // 14px
    base: { mobile: '1rem', desktop: '1rem' },        // 16px
    lg: { mobile: '1.125rem', desktop: '1.125rem' },  // 18px
    xl: { mobile: '1.25rem', desktop: '1.25rem' },    // 20px
    '2xl': { mobile: '1.5rem', desktop: '1.5rem' },   // 24px
    '3xl': { mobile: '1.875rem', desktop: '1.875rem' }, // 30px
    '4xl': { mobile: '2.25rem', desktop: '2.25rem' }, // 36px
    '5xl': { mobile: '3rem', desktop: '3rem' },       // 48px
    '6xl': { mobile: '3.75rem', desktop: '3.75rem' }, // 60px
    '7xl': { mobile: '4.5rem', desktop: '4.5rem' },   // 72px
    '8xl': { mobile: '6rem', desktop: '6rem' },       // 96px
  },

  // Line Heights
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
} as const;

// Color System
export const colors = {
  // Brand Colors
  brand: {
    primary: {
      50: 'hsl(180, 38%, 92%)',
      100: 'hsl(180, 38%, 84%)',
      200: 'hsl(180, 34%, 68%)',
      300: 'hsl(180, 34%, 60%)',
      400: 'hsl(180, 34%, 45%)',
      500: 'hsl(180, 34%, 37%)',
      600: 'hsl(180, 34%, 28%)',
      700: 'hsl(180, 34%, 19%)',
      800: 'hsl(180, 34%, 10%)',
      900: 'hsl(0, 0%, 0%)',
    },
    secondary: {
      50: 'hsl(0, 100%, 97%)',
      100: 'hsl(0, 100%, 94%)',
      200: 'hsl(0, 100%, 88%)',
      300: 'hsl(0, 100%, 82%)',
      400: 'hsl(0, 100%, 76%)',
      500: 'hsl(0, 100%, 71%)',
      600: 'hsl(0, 100%, 65%)',
      700: 'hsl(0, 100%, 59%)',
      800: 'hsl(0, 100%, 53%)',
      900: 'hsl(0, 100%, 47%)',
    },
  },

  // Neutral Colors
  neutral: {
    50: 'hsl(0, 0%, 96%)',
    100: 'hsl(0, 0%, 92%)',
    200: 'hsl(0, 0%, 84%)',
    300: 'hsl(0, 0%, 76%)',
    400: 'hsl(0, 0%, 69%)',
    500: 'hsl(0, 0%, 61%)',
    600: 'hsl(0, 0%, 53%)',
    700: 'hsl(0, 0%, 45%)',
    800: 'hsl(0, 0%, 37%)',
    900: 'hsl(0, 0%, 11%)',
  },

  // Semantic Colors
  semantic: {
    success: {
      50: 'hsl(142, 76%, 96%)',
      500: 'hsl(142, 76%, 36%)',
      600: 'hsl(142, 76%, 30%)',
    },
    warning: {
      50: 'hsl(48, 96%, 96%)',
      500: 'hsl(48, 96%, 53%)',
      600: 'hsl(48, 96%, 47%)',
    },
    error: {
      50: 'hsl(0, 93%, 96%)',
      500: 'hsl(0, 84%, 60%)',
      600: 'hsl(0, 84%, 54%)',
    },
    info: {
      50: 'hsl(204, 100%, 97%)',
      500: 'hsl(204, 96%, 53%)',
      600: 'hsl(204, 96%, 47%)',
    },
  },

  // Background Colors
  background: {
    primary: 'hsl(0, 0%, 100%)',
    secondary: 'hsl(180, 50%, 97%)',
    tertiary: 'hsl(179, 43%, 95%)',
    overlay: 'hsla(0, 0%, 0%, 0.5)',
  },
} as const;

// Spacing Scale (8px base grid)
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// Border Radius
export const radius = {
  none: '0',
  sm: '0.125rem',   // 2px
  default: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
} as const;

// Animation & Transitions
export const animation = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Z-Index Scale
export const zIndex = {
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Component-specific tokens
export const components = {
  button: {
    height: {
      sm: '2rem',    // 32px
      md: '2.5rem',  // 40px
      lg: '3rem',    // 48px
    },
    padding: {
      sm: { x: '0.75rem', y: '0.25rem' },  // 12px 4px
      md: { x: '1rem', y: '0.5rem' },      // 16px 8px
      lg: { x: '1.5rem', y: '0.75rem' },   // 24px 12px
    },
  },
  card: {
    padding: {
      sm: '1rem',      // 16px
      md: '1.5rem',    // 24px
      lg: '2rem',      // 32px
    },
  },
  input: {
    height: {
      sm: '2rem',     // 32px
      md: '2.5rem',   // 40px
      lg: '3rem',     // 48px
    },
  },
} as const;

// Layout Constraints
export const layout = {
  maxWidth: {
    prose: '65ch',
    screen: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    content: '1200px',
    wide: '1440px',
  },
  container: {
    padding: {
      mobile: '1rem',    // 16px
      tablet: '2rem',    // 32px
      desktop: '3rem',   // 48px
    },
  },
} as const;