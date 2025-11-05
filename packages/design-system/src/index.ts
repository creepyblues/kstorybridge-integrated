/**
 * KStoryBridge Design System
 *
 * Shared design system for all dashboard applications.
 * Provides primitives, colors, and tokens for consistent UI.
 *
 * @packageDocumentation
 */

// Design Primitives
export { Surface } from './components/Surface';
export type { SurfaceProps } from './components/Surface';

export { Stack } from './components/Stack';
export type { StackProps } from './components/Stack';

// Colors
export { essentialColors, semanticColors, formatColors, tailwindColors } from './colors';

// Design Tokens
export { tokens, spacing, borderRadius, borderWidth, shadows, fontSize, fontWeight, lineHeight, iconSize, transitions, zIndex, componentTokens } from './styles/tokens';

// Utilities
export { cn } from './lib/utils';
