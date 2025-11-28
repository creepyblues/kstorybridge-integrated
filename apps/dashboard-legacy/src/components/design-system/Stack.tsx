/**
 * Stack Component
 *
 * Vertical layout primitive with consistent spacing between children.
 * Replaces manual flex/grid layouts with semantic, consistent spacing.
 *
 * Usage:
 *   <Stack gap="md">
 *     <Surface>Item 1</Surface>
 *     <Surface>Item 2</Surface>
 *   </Stack>
 *
 * Design Philosophy:
 *   - Handles vertical spacing automatically
 *   - No manual margin-bottom on children
 *   - Consistent gap across all screen sizes
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const stackVariants = cva('flex flex-col', {
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
      stretch: 'items-stretch',
    },

    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
  },

  defaultVariants: {
    gap: 'md',
    align: 'stretch',
    justify: 'start',
  },
});

export interface StackProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof stackVariants> {
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
 * Stack - Vertical layout with consistent spacing
 *
 * Use for any vertical list of elements
 */
export const Stack = React.forwardRef<HTMLElement, StackProps>(
  (
    { as: Component = 'div', gap, align, justify, className, children, ...props },
    ref
  ) => {
    return (
      <Component
        ref={ref as any}
        className={cn(stackVariants({ gap, align, justify }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Stack.displayName = 'Stack';

export default Stack;