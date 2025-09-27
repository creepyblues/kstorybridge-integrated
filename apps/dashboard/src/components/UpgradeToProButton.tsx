import { useState } from 'react';
import { Button } from "@kstorybridge/ui";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UpgradeToProButtonProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const UpgradeToProButton = ({ children, className, disabled = false, style }: UpgradeToProButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to upgrade to Pro.',
        variant: 'destructive',
      });
      return;
    }

    if (disabled) {
      return;
    }

    setIsLoading(true);

    try {
      // Call the create-checkout-session edge function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.sessionId) {
        // Redirect to Stripe Checkout
        const stripe = (await import('@/lib/stripe')).default;
        const stripeInstance = await stripe;

        if (stripeInstance) {
          const { error: stripeError } = await stripeInstance.redirectToCheckout({
            sessionId: data.sessionId,
          });

          if (stripeError) {
            throw new Error(stripeError.message);
          }
        }
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Upgrade failed',
        description: error instanceof Error ? error.message : 'An error occurred during upgrade',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUpgrade}
      disabled={isLoading || disabled}
      className={className}
      style={style}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Processing...
        </div>
      ) : (
        children
      )}
    </Button>
  );
};

export default UpgradeToProButton;