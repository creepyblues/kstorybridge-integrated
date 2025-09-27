import React from 'react';
import { Surface, Stack } from '@/components/design-system';
import { cn } from '@/lib/utils';

interface StandardCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  /**
   * Padding variant for the card
   * @default 'md'
   */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Bottom spacing variant
   * @default 'md'
   */
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * StandardCard - Centralized card component using design system
 *
 * Now uses Surface internally - all styling controlled by design-tokens.css
 * Change padding/spacing globally by editing Surface.tsx or design-tokens.css
 */
export const StandardCard: React.FC<StandardCardProps> = ({
  title,
  children,
  className,
  contentClassName,
  headerClassName,
  padding = 'md',
  spacing = 'md',
}) => {
  return (
    <Surface
      variant="card"
      padding={padding}
      spacing={spacing}
      className={className}
      as="section"
    >
      <Stack gap="sm">
        {title && (
          <h3 className={cn("text-lg font-semibold", headerClassName)}>
            {title}
          </h3>
        )}
        <div className={contentClassName}>
          {children}
        </div>
      </Stack>
    </Surface>
  );
};

export default StandardCard;