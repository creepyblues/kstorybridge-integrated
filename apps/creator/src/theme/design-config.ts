/**
 * Design System Configuration
 *
 * TypeScript types and constants for the design system.
 * Provides type-safe access to design tokens defined in design-tokens.css
 *
 * Last Updated: 2025-01-26
 */

export const spacing = {
  xs: 'var(--space-xs)',
  sm: 'var(--space-sm)',
  md: 'var(--space-md)',
  lg: 'var(--space-lg)',
  xl: 'var(--space-xl)',
  '2xl': 'var(--space-2xl)',
  '3xl': 'var(--space-3xl)',
} as const;

export const radius = {
  xs: 'var(--radius-xs)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: 'var(--radius-full)',
} as const;

export const borderWidth = {
  thin: 'var(--border-thin)',
  medium: 'var(--border-medium)',
  thick: 'var(--border-thick)',
} as const;

export const shadow = {
  none: 'var(--shadow-none)',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
} as const;

export const fontSize = {
  xs: 'var(--font-size-xs)',
  sm: 'var(--font-size-sm)',
  base: 'var(--font-size-base)',
  lg: 'var(--font-size-lg)',
  xl: 'var(--font-size-xl)',
  '2xl': 'var(--font-size-2xl)',
  '3xl': 'var(--font-size-3xl)',
} as const;

export const fontWeight = {
  normal: 'var(--font-weight-normal)',
  medium: 'var(--font-weight-medium)',
  semibold: 'var(--font-weight-semibold)',
  bold: 'var(--font-weight-bold)',
} as const;

export const lineHeight = {
  tight: 'var(--line-height-tight)',
  normal: 'var(--line-height-normal)',
  relaxed: 'var(--line-height-relaxed)',
} as const;

export const iconSize = {
  xs: 'var(--icon-xs)',
  sm: 'var(--icon-sm)',
  md: 'var(--icon-md)',
  lg: 'var(--icon-lg)',
  xl: 'var(--icon-xl)',
  '2xl': 'var(--icon-2xl)',
} as const;

export const transition = {
  fast: 'var(--transition-fast)',
  normal: 'var(--transition-normal)',
  slow: 'var(--transition-slow)',
} as const;

export const zIndex = {
  base: 'var(--z-base)',
  dropdown: 'var(--z-dropdown)',
  sticky: 'var(--z-sticky)',
  fixed: 'var(--z-fixed)',
  modalBackdrop: 'var(--z-modal-backdrop)',
  modal: 'var(--z-modal)',
  popover: 'var(--z-popover)',
  tooltip: 'var(--z-tooltip)',
} as const;

// Component-specific tokens
export const surface = {
  bg: {
    default: 'var(--surface-bg-default)',
    elevated: 'var(--surface-bg-elevated)',
    flat: 'var(--surface-bg-flat)',
  },
  border: {
    color: 'var(--surface-border-color)',
    width: 'var(--surface-border-width)',
  },
  shadow: 'var(--surface-shadow)',
  radius: 'var(--surface-radius)',
  padding: {
    sm: 'var(--surface-padding-sm)',
    md: 'var(--surface-padding-md)',
    lg: 'var(--surface-padding-lg)',
  },
} as const;

export const button = {
  border: {
    color: 'var(--button-border-color)',
    width: 'var(--button-border-width)',
  },
  hoverBg: 'var(--button-hover-bg)',
  radius: 'var(--button-radius)',
  padding: {
    x: 'var(--button-padding-x)',
    y: 'var(--button-padding-y)',
  },
} as const;

export const badge = {
  radius: 'var(--badge-radius)',
  padding: {
    x: 'var(--badge-padding-x)',
    y: 'var(--badge-padding-y)',
  },
  fontSize: 'var(--badge-font-size)',
  fontWeight: 'var(--badge-font-weight)',
} as const;

export const emptyState = {
  icon: {
    size: 'var(--empty-state-icon-size)',
    sizeSm: 'var(--empty-state-icon-size-sm)',
    sizeLg: 'var(--empty-state-icon-size-lg)',
    color: 'var(--empty-state-icon-color)',
  },
  title: {
    size: 'var(--empty-state-title-size)',
    color: 'var(--empty-state-title-color)',
  },
  description: {
    size: 'var(--empty-state-desc-size)',
    color: 'var(--empty-state-desc-color)',
  },
} as const;

// Type exports for TypeScript autocomplete
export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type BorderWidth = keyof typeof borderWidth;
export type Shadow = keyof typeof shadow;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type LineHeight = keyof typeof lineHeight;
export type IconSize = keyof typeof iconSize;
export type Transition = keyof typeof transition;
export type ZIndex = keyof typeof zIndex;

// Design system configuration export
export const designConfig = {
  spacing,
  radius,
  borderWidth,
  shadow,
  fontSize,
  fontWeight,
  lineHeight,
  iconSize,
  transition,
  zIndex,
  components: {
    surface,
    button,
    badge,
    emptyState,
  },
} as const;

export default designConfig;