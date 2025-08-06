import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import stripePromise from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PaymentButtonProps {
  planType: 'creator_premium' | 'buyer_pro' | 'buyer_enterprise';
  priceId: string;
  children: React.ReactNode;
  className?: string;
}

const PaymentButton = ({ planType, priceId, children, className }: PaymentButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to subscribe to a plan.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call your backend to create a Stripe Checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          planType,
          userId: user.id,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe && data.sessionId) {
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment failed',
        description: error instanceof Error ? error.message : 'An error occurred during payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSubscribe}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Processing...' : children}
    </Button>
  );
};

export default PaymentButton;