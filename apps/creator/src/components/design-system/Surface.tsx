/**
 * Surface Component
 *
 * The foundational primitive that replaces all <div> elements.
 * Provides semantic HTML with consistent styling through variants.
 *
 * Usage:
 *   <Surface variant="card">Content</Surface>
 *   <Surface as="article" variant="elevated">Article</Surface>
 *   <Surface as="header" variant="transparent" padding="none">Header</Surface>
 *
 * Design Philosophy:
 *   - No raw divs - always use Surface with semantic HTML
 *   - Variants control all styling - no inline styles
 *   - Consistent spacing through padding/spacing props
 */

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const surfaceVariants = cva('', {
  variants: {
    variant: {
      // Default card style - transparent bg, gray border, no shadow
      card: 'bg-transparent border border-gray-300 shadow-none rounded-2xl',

      // Elevated surface - white bg with subtle shadow
      elevated: 'bg-white border border-gray-200 shadow-sm rounded-2xl',

      // Flat surface - light gray background
      flat: 'bg-gray-50 rounded-lg',

      // Transparent - no styling (for semantic wrappers)
      transparent: 'bg-transparent',

      // Outlined - border only
      outlined: 'border border-gray-300 rounded-xl',
    },

    padding: {
      none: 'p-0',
      xs: 'p-2',
      sm: 'p-6',
      md: 'p-10 sm:p-10',
      lg: 'p-12 sm:p-20',
      xl: 'p-6 sm:p-12 lg:p-12',
    },

    spacing: {
      none: '',
      xs: 'mb-2',
      sm: 'mb-4',
      md: 'mb-6 sm:mb-8 lg:mb-12',
      lg: 'mb-8 sm:mb-12 lg:mb-16',
      xl: 'mb-12 sm:mb-16 lg:mb-20',
    },
  },

  defaultVariants: {
    variant: 'card',
    padding: 'md',
    spacing: 'md',
  },
});

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLElement>,
  VariantProps<typeof surfaceVariants> {
  /**
   * Semantic HTML element to render
   * @default 'section'
   */
  as?: keyof JSX.IntrinsicElements;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Child elements
   */
  children?: React.ReactNode;
}

/**
 * Surface - The base primitive for all layout elements
 *
 * Replaces <div> with semantic HTML and consistent styling
 */
export const Surface = React.forwardRef<HTMLElement, SurfaceProps>(
  (
    {
      as: Component = 'section',
      variant,
      padding,
      spacing,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref as any}
        className={cn(surfaceVariants({ variant, padding, spacing }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Surface.displayName = 'Surface';

export default Surface;