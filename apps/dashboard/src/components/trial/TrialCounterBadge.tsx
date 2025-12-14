import { useTrial } from '@/contexts/TrialContext';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

export function TrialCounterBadge() {
  const { remainingTrials, maxTrials } = useTrial();

  const getColorClasses = () => {
    if (remainingTrials === 0) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (remainingTrials === 1) {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    }
    if (remainingTrials === 2) {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-xs sm:text-sm font-medium whitespace-nowrap',
        getColorClasses()
      )}
    >
      <Icon icon="solar:bolt-bold-duotone" className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
      <span className="hidden sm:inline">
        {remainingTrials} of {maxTrials} searches left
      </span>
      <span className="sm:hidden">
        {remainingTrials} of {maxTrials}
      </span>
    </div>
  );
}
