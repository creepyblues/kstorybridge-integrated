import { Icon } from '@iconify/react';
import { UserTier } from '@/contexts/TierContext';

interface ProBadgeProps {
  tier: UserTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ProBadge({ tier, size = 'md', showLabel = true }: ProBadgeProps) {
  if (tier === 'basic' || tier === 'invited') {
    return null; // Don't show badge for basic/invited tiers
  }

  const config = {
    pro: {
      icon: 'solar:stars-bold-duotone',
      label: 'Pro',
      color: 'bg-pro-purple',
      textColor: 'text-white',
    },
    suite: {
      icon: 'solar:crown-bold-duotone',
      label: 'Suite',
      color: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
      textColor: 'text-white',
    },
  };

  const tierConfig = config[tier as 'pro' | 'suite'];
  if (!tierConfig) return null;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 ${tierConfig.color} ${tierConfig.textColor} ${sizeClasses[size]} rounded-full font-semibold`}
    >
      <Icon icon={tierConfig.icon} className={iconSizes[size]} />
      {showLabel && tierConfig.label}
    </span>
  );
}
