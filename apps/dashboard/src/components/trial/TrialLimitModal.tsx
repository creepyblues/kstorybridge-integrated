import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTrial } from '@/contexts/TrialContext';
import { Icon } from '@iconify/react';

const benefits = [
  { icon: 'solar:bolt-bold-duotone', text: 'Unlimited AI-powered searches' },
  { icon: 'solar:history-bold-duotone', text: 'Save and revisit your search history' },
  { icon: 'solar:heart-bold-duotone', text: 'Save your favorite titles' },
  { icon: 'solar:stars-bold-duotone', text: 'Access to AI chat assistant (Jinu)' },
];

export function TrialLimitModal() {
  const { showLimitModal, setShowLimitModal, maxTrials } = useTrial();

  return (
    <Dialog open={showLimitModal} onOpenChange={setShowLimitModal}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            You've used all {maxTrials} trial searches!
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Sign up for free to continue discovering Korean content
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-hanok-teal/10 flex items-center justify-center">
                <Icon icon={benefit.icon} className="h-4 w-4 text-hanok-teal" />
              </div>
              <span className="text-gray-700">{benefit.text}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <Link to="/signup" className="block">
            <Button className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white py-6 text-lg">
              Sign Up Free
            </Button>
          </Link>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/signin" className="text-hanok-teal hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
