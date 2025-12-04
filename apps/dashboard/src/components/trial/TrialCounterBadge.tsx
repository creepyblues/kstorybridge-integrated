import { useTrial } from '@/contexts/TrialContext';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

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
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium',
        getColorClasses()
      )}
    >
      <Zap className="h-4 w-4" />
      <span>
        {remainingTrials} of {maxTrials} searches left
      </span>
    </div>
  );
}
