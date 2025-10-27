import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTierAccess } from '@/contexts/TierContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles } from 'lucide-react';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetch } = useTierAccess();
  const tier = searchParams.get('tier') || 'pro';

  useEffect(() => {
    // Refetch tier to get updated subscription status
    refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="bg-green-50 rounded-full p-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-black mb-2">Payment Successful!</h2>
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
