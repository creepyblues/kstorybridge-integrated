/**
 * Design Tokens - TypeScript Constants
 *
 * Centralized design values for programmatic usage.
 * For CSS variable usage, import tokens.css instead.
 */

export const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const;

export const borderRadius = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px - rounded-2xl (standard)
  full: '9999px',  // Fully rounded
} as const;

export const borderWidth = {
  thin: '1px',
  medium: '2px',
  thick: '3px',
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
} as const;

export const fontSize = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const iconSize = {
  xs: '1rem',      // 16px
  sm: '1.25rem',   // 20px
  md: '1.5rem',    // 24px
  lg: '2rem',      // 32px
  xl: '2.5rem',    // 40px
  '2xl': '3rem',   // 48px
} as const;

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
} as const;

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const;

// Component-specific tokens
export const componentTokens = {
  surface: {
    bgDefault: 'transparent',
    borderColor: 'var(--color-gray-300)',
    borderWidth: borderWidth.thin,
    shadow: shadows.none,
    radius: borderRadius.xl,
    paddingSm: spacing.md,
    paddingMd: spacing.lg,
    paddingLg: spacing['2xl'],
  },
  button: {
    borderColor: 'var(--color-gray-300)',
    borderWidth: borderWidth.thin,
    hoverBg: 'var(--color-gray-100)',
    radius: borderRadius.sm,
    paddingX: spacing.md,
    paddingY: spacing.sm,
  },
  badge: {
    radius: borderRadius.full,
    paddingX: '0.625rem', // 10px
    paddingY: '0.125rem', // 2px
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  emptyState: {
    iconSize: '2.5rem',       // 40px default
    iconSizeSm: '2rem',       // 32px
    iconSizeLg: '3rem',       // 48px
    iconColor: 'var(--color-gray-400)',
    titleSize: fontSize.lg,
    titleColor: 'var(--color-gray-900)',
    descSize: fontSize.base,
    descColor: 'var(--color-gray-600)',
  },
} as const;

// Export all tokens as a single object
export const tokens = {
  spacing,
  borderRadius,
  borderWidth,
  shadows,
  fontSize,
  fontWeight,
  lineHeight,
  iconSize,
  transitions,
  zIndex,
  components: componentTokens,
} as const;
