import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { trackCheckout, trackCheckoutAbandoned } from '@/utils/analytics';

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

  // Tracking refs for checkout abandonment
  const pageStartTimeRef = useRef<number>(Date.now());
  const currentStepRef = useRef<string>('loading');
  const isRedirectingRef = useRef<boolean>(false);

  // Track checkout abandonment on page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Don't track if successfully redirecting to Stripe
      if (isRedirectingRef.current) return;

      const timeOnPageMs = Date.now() - pageStartTimeRef.current;
      trackCheckoutAbandoned(tier || 'unknown', timeOnPageMs, currentStepRef.current);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Track on unmount if not redirecting
      if (!isRedirectingRef.current && tier) {
        const timeOnPageMs = Date.now() - pageStartTimeRef.current;
        trackCheckoutAbandoned(tier, timeOnPageMs, currentStepRef.current);
      }
    };
  }, [tier]);

  useEffect(() => {
    if (!tier || !user?.id || !user?.email) {
      setError('Missing required information');
      setLoading(false);
      currentStepRef.current = 'error';
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
      currentStepRef.current = 'redirecting';

      // Use direct URL redirect if available (more reliable), otherwise use Stripe.js
      if (data.url) {
        console.log('🔗 Using direct checkout URL');
        isRedirectingRef.current = true; // Mark as redirecting to prevent abandonment tracking
        window.location.href = data.url;
      } else {
        // Fallback to Stripe.js redirect
        const stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Stripe failed to load. Please check your configuration.');
        }

        isRedirectingRef.current = true; // Mark as redirecting to prevent abandonment tracking
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (stripeError) {
          isRedirectingRef.current = false; // Reset if redirect fails
          throw new Error(stripeError.message);
        }
      }
    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      setError(error.message);
      setLoading(false);
      currentStepRef.current = 'error';

      // Track checkout error
      trackCheckout('error', tier || 'unknown', undefined, { error: error.message?.substring(0, 50) });

      toast({
        title: 'Checkout Error',
        description: error.message || 'Failed to start checkout process',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    // Track checkout cancelled
    if (tier) {
      trackCheckout('cancelled', tier);
    }
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
                <Icon icon="solar:shield-bold-duotone" className="h-12 w-12 text-red-500" />
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
              <Icon icon="solar:shield-bold-duotone" className="h-12 w-12 text-white" />
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
            <Icon icon="solar:refresh-circle-bold-duotone" className="h-5 w-5 animate-spin text-hanok-teal" />
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
