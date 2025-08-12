import { useEffect, useState } from 'react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@kstorybridge/ui";

import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Subscription {
  id: string;
  plan_type: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

const SubscriptionStatus = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setIsCanceling(true);

    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscriptionId: subscription.id,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Subscription canceled',
        description: 'Your subscription has been canceled and will end at the current period.',
      });

      fetchSubscription();
    } catch (error) {
      console.error('Cancellation error:', error);
      toast({
        title: 'Cancellation failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsCanceling(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No active subscription found.</p>
        </CardContent>
      </Card>
    );
  }

  const formatPlanType = (planType: string) => {
    return planType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Plan:</span>
          <span>{formatPlanType(subscription.plan_type)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Status:</span>
          <Badge className={getStatusColor(subscription.status)}>
            {subscription.status}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-medium">Next billing date:</span>
          <span>{formatDate(subscription.current_period_end)}</span>
        </div>
        
        {subscription.cancel_at_period_end && (
          <div className="flex justify-between items-center">
            <span className="font-medium text-orange-600">
              Cancellation scheduled:
            </span>
            <span className="text-orange-600">
              Will end on {formatDate(subscription.current_period_end)}
            </span>
          </div>
        )}
        
        {subscription.status === 'active' && !subscription.cancel_at_period_end && (
          <Button
            variant="outline"
            onClick={handleCancelSubscription}
            disabled={isCanceling}
            className="w-full mt-4"
          >
            {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;