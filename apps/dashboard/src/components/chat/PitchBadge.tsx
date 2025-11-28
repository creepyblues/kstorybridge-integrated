import React from 'react';

interface PitchBadgeProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

/**
 * PitchBadge - Centralized badge component for "Pitch" indicator
 *
 * Matches design system for visual consistency.
 * Used across title cards, search results, chat interface, and carousels.
 *
 * Design:
 * - Color: #FF6B6B (coral red) for pitch availability
 * - Sizing: Standard badge padding (px-2.5 py-0.5)
 * - Font: text-xs font-semibold
 * - Shape: rounded-full (pill shape)
 *
 * Usage:
 * <PitchBadge /> - Default size
 * <PitchBadge size="sm" /> - Small size for overlays
 * <PitchBadge size="lg" /> - Large size
 */
export const PitchBadge: React.FC<PitchBadgeProps> = ({
  size = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs",
    default: "px-2.5 py-0.5 text-xs",
    lg: "px-2.5 py-0.5 text-xs"
  };

  return (
    <span
      className={`inline-block rounded-full font-semibold shadow-lg text-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: '#FF6B6B' }}
      title="Pitch deck available for this title"
    >
      Pitch
    </span>
  );
};

export default PitchBadge;
