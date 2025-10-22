/**
 * Inline Component
 *
 * Horizontal layout primitive with consistent spacing between children.
 * Replaces manual flex layouts with semantic, consistent spacing.
 *
 * Usage:
 *   <Inline gap="sm">
 *     <Button>Action 1</Button>
 *     <Button>Action 2</Button>
 *   </Inline>
 *
 * Design Philosophy:
 *   - Handles horizontal spacing automatically
 *   - Supports wrapping for responsive layouts
 *   - Consistent gap across all screen sizes
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const inlineVariants = cva('flex', {
  variants: {
    gap: {
      none: 'gap-0',
      xs: 'gap-2',
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
      xl: 'gap-12',
    },

    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    },

    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
    },

    wrap: {
      wrap: 'flex-wrap',
      nowrap: 'flex-nowrap',
      reverse: 'flex-wrap-reverse',
    },
  },

  defaultVariants: {
    gap: 'md',
    align: 'center',
    justify: 'start',
    wrap: 'nowrap',
  },
});

export interface InlineProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof inlineVariants> {
  /**
   * Semantic HTML element to render
   * @default 'div'
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
 * Inline - Horizontal layout with consistent spacing
 *
 * Use for any horizontal row of elements
 */
export const Inline = React.forwardRef<HTMLElement, InlineProps>(
  (
    {
      as: Component = 'div',
      gap,
      align,
      justify,
      wrap,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref as any}
        className={cn(inlineVariants({ gap, align, justify, wrap }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Inline.displayName = 'Inline';

export default Inline;