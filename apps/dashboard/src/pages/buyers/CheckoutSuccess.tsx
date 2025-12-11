import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTierAccess } from '@/contexts/TierContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles } from 'lucide-react';
import { trackCheckout, trackConversion } from '@/utils/analytics';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetch } = useTierAccess();
  const tier = searchParams.get('tier') || 'pro';
  const hasTracked = useRef(false);

  useEffect(() => {
    // Track checkout completed (once)
    if (!hasTracked.current) {
      hasTracked.current = true;
      const value = tier === 'pro' ? 250 : tier === 'suite' ? 500 : 0;
      trackCheckout('completed', tier, value);
      trackConversion(`subscription_purchased_${tier}`, value, 'USD');
    }

    // Refetch tier once on mount to get updated subscription status
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // Empty deps - only run once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/40 via-teal-50/20 to-cyan-50/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border border-gray-200 shadow-sm">
        <CardContent className="p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-hanok-teal mb-2">Payment Successful!</h2>
            <p className="text-gray-600">
              Welcome to <span className="font-semibold capitalize">{tier}</span> tier
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <div className="font-medium mb-1">Your subscription is now active</div>
                <div>
                  You now have access to all {tier === 'pro' ? 'Pro' : 'Suite'} features including:
                </div>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Access to pitch decks</li>
                  <li>Premium title analytics</li>
                  {tier === 'suite' && (
                    <>
                      <li>Priority support</li>
                      <li>Early access to new titles</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/buyers/titles')}
              className="w-full bg-pro-purple hover:bg-pro-purple/90"
            >
              Start Exploring Titles
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/buyers/profile')}
              className="w-full border-gray-300"
            >
              View Profile
            </Button>
          </div>

          {/* Email Confirmation */}
          <p className="text-xs text-gray-500">
            A confirmation email has been sent to your inbox
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
