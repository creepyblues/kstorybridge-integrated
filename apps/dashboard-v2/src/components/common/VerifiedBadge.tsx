import React from 'react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

/**
 * VerifiedBadge - Image-based badge for verified/official titles
 *
 * Displays custom verification badge image from Supabase storage.
 * Used on title cards to indicate officially verified content.
 *
 * Usage:
 * <VerifiedBadge /> - Default size
 * <VerifiedBadge size="sm" /> - Small size for overlays
 * <VerifiedBadge size="lg" /> - Large size
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'default',
  className
}) => {
  const imageSizes = {
    sm: "h-9 w-auto",      // Small for card overlays (50% bigger)
    default: "h-12 w-auto", // Default size (50% bigger)
    lg: "h-15 w-auto"      // Large size (50% bigger)
  };

  return (
    <img
      src="https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/public/images/verified.png"
      alt="Verified"
      className={cn(
        "inline-block",
        imageSizes[size],
        className
      )}
      title="Verified official content"
    />
  );
};

export default VerifiedBadge;
