/**
 * EmptyState Component
 *
 * Consistent "no items found" pattern used across the dashboard.
 * Replaces custom empty state implementations with a standardized component.
 *
 * Usage:
 *   <EmptyState icon={Heart} title="No favorites found" />
 *   <EmptyState icon={Search} title="No results" description="Try different keywords" />
 *   <EmptyState icon={Inbox} title="All done!" action={<Button>Add New</Button>} />
 *
 * Design Philosophy:
 *   - Consistent empty states across all pages
 *   - Change icon size/color in ONE place
 *   - Semantic HTML structure
 */

import * as React from 'react';
import { Surface } from './Surface';
import { Stack } from './Stack';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  /**
   * Icon component from lucide-react
   */
  icon: LucideIcon;

  /**
   * Main heading text
   */
  title: string;

  /**
   * Optional description text
   */
  description?: string;

  /**
   * Optional action button or element
   */
  action?: React.ReactNode;

  /**
   * Size variant
   * @default 'default'
   */
  size?: 'sm' | 'default' | 'lg';

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * EmptyState - Standardized empty state component
 *
 * Use whenever showing "no items found" or similar states
 */
export const EmptyState = React.forwardRef<HTMLElement, EmptyStateProps>(
  ({ icon: Icon, title, description, action, size = 'default', className }, ref) => {
    const iconSizes = {
      sm: 'h-6 w-6 sm:h-8 sm:w-8',
      default: 'h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12',
      lg: 'h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16',
    };

    const titleSizes = {
      sm: 'text-sm sm:text-base',
      default: 'text-base sm:text-lg',
      lg: 'text-lg sm:text-xl',
    };

    const descriptionSizes = {
      sm: 'text-xs sm:text-sm',
      default: 'text-sm sm:text-base',
      lg: 'text-base sm:text-lg',
    };

    return (
      <Surface
        ref={ref}
        variant="card"
        padding="lg"
        spacing="md"
        className={cn('text-center', className)}
        as="article"
        role="status"
        aria-live="polite"
      >
        <Stack gap="sm" align="center">
          <Icon
            className={cn(
              'text-midnight-ink-400 mx-auto',
              iconSizes[size]
            )}
            aria-hidden="true"
          />

          <h3
            className={cn(
              'font-medium text-midnight-ink',
              titleSizes[size]
            )}
          >
            {title}
          </h3>

          {description && (
            <p
              className={cn(
                'text-midnight-ink-600',
                descriptionSizes[size]
              )}
            >
              {description}
            </p>
          )}

          {action && (
            <Stack gap="sm" align="center" className="mt-2">
              {action}
            </Stack>
          )}
        </Stack>
      </Surface>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;