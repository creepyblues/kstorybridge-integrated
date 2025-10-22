import React from 'react';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProBadgeProps {
  tier: 'pro' | 'suite';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const ProBadge: React.FC<ProBadgeProps> = ({
  tier,
  size = 'default',
  showIcon = true,
  className
}) => {
  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-xs",
    default: "px-2.5 py-0.5 text-xs",
    lg: "px-2.5 py-0.5 text-xs"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 bg-pro-purple text-white rounded-full font-semibold",
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Crown className={iconSizes[size]} />}
      {tier}
    </span>
  );
};

export default ProBadge;