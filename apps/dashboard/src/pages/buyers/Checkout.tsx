import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';

// Initialize Stripe.js with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

/**
 * Checkout Page - Stripe Integration
 *
 * Workflow:
 * 1. Call create-checkout-session edge function
 * 2. Redirect to Stripe Checkout
 * 3. On success, Stripe redirects to /buyers/checkout/success
 * 4. Webhook updates user tier in database
 */

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const tier = searchParams.get('tier') as 'pro' | 'suite' | null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tier || !user?.id || !user?.email) {
      setError('Missing required information');
      setLoading(false);
      return;
    }

    createCheckoutSession();
  }, [tier, user]);

  const createCheckoutSession = async () => {
    if (!tier || !user?.id || !user?.email) return;

    try {
      console.log('🛒 Creating checkout session for tier:', tier);

      // Call edge function to create Stripe checkout session
      const { data, error: functionError } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            tier,
            userId: user.id,
            email: user.email,
          },
        }
      );

      if (functionError) {
        console.error('❌ Checkout session error:', functionError);
        // Try to get error details from the response
        const errorMessage = data?.error || functionError.message || 'Failed to create checkout session';
        console.error('❌ Error details:', data);
        throw new Error(errorMessage);
      }

      if (data?.error) {
        console.error('❌ API Error:', data.error);
        throw new Error(data.error);
      }

      if (!data?.url && !data?.sessionId) {
        console.error('❌ Unexpected response:', data);
        throw new Error('No checkout URL or session ID returned');
      }

      console.log('✅ Redirecting to Stripe Checkout:', data.sessionId);

      // Use direct URL redirect if available (more reliable), otherwise use Stripe.js
      if (data.url) {
        console.log('🔗 Using direct checkout URL');
        window.location.href = data.url;
      } else {
        // Fallback to Stripe.js redirect
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Stripe failed to load. Please check your configuration.');
        }

        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }
      }
    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      setError(error.message);
      setLoading(false);

      toast({
        title: 'Checkout Error',
        description: error.message || 'Failed to start checkout process',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    navigate('/buyers/plan');
  };

  // If there's an error, show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50/40 via-teal-50/20 to-cyan-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border border-gray-200 shadow-sm">
          <CardContent className="p-8 text-center space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="bg-red-100 rounded-2xl p-4">
                <Lock className="h-12 w-12 text-red-500" />
              </div>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold text-hanok-teal mb-2">Checkout Error</h2>
              <p className="text-sm text-gray-600">{error}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-pro-purple hover:bg-pro-purple/90"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="w-full border-gray-300"
              >
                Back to Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state while creating session
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/40 via-teal-50/20 to-cyan-50/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border border-gray-200 shadow-sm">
        <CardContent className="p-8 text-center space-y-6">
          {/* Lock Icon */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-hanok-teal to-hanok-teal/80 rounded-2xl p-4 shadow-lg">
              <Lock className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-hanok-teal mb-2">Secure Checkout</h2>
            <p className="text-gray-600">
              Upgrading to <span className="font-semibold capitalize">{tier}</span> tier
            </p>
          </div>

          {/* Loading State */}
          <div className="flex items-center justify-center gap-2 text-gray-500 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-hanok-teal" />
            <span>
              {loading ? 'Creating checkout session...' : 'Redirecting to Stripe...'}
            </span>
          </div>

          {/* Security Note */}
          <p className="text-xs text-gray-500">
            🔒 Payments are securely processed by Stripe
          </p>

          {/* Cancel Button */}
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full border-gray-300"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
