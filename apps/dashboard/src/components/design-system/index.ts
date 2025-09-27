/**
 * Design System Components
 *
 * Centralized export for all design system primitives.
 * Import from here to use the design system consistently.
 *
 * Usage:
 *   import { Surface, Stack, EmptyState } from '@/components/design-system';
 *
 * Last Updated: 2025-01-26
 */

// Layout Primitives
export { Surface, type SurfaceProps } from './Surface';
export { Stack, type StackProps } from './Stack';
export { Inline, type InlineProps } from './Inline';

// Pattern Components
export { EmptyState, type EmptyStateProps } from './EmptyState';

// Re-export design configuration
export { designConfig } from '@/theme/design-config';