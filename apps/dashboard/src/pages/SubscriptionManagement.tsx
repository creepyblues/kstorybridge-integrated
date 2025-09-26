import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { useToast } from '@/hooks/use-toast';
import { Crown, Calendar, CreditCard, Settings, AlertTriangle, ExternalLink, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTierAccess } from '@/hooks/useTierAccess';
import { supabase } from '@/integrations/supabase/client';
import { useSessionCache } from '@/hooks/useSessionCache';
import { cn } from '@/lib/utils';

interface StripeCustomerData {
  stripe_customer_id: string;
  stripe_subscription_id: string;
  subscription_status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

const SubscriptionManagement = () => {
  const { user } = useAuth();
  const { tier, loading: tierLoading } = useTierAccess();
  const { toast } = useToast();
  const { } = useSessionCache(); // Initialize session cache
  const [stripeData, setStripeData] = useState<StripeCustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error loading subscription:', error);
        toast({
          title: 'Error loading subscription',
          description: 'Unable to load subscription data.',
          variant: 'destructive',
        });
      } else if (data) {
        setStripeData(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const openBillingPortal = async () => {
    if (!stripeData?.stripe_customer_id) {
      toast({
        title: 'No active subscription',
        description: 'You need an active subscription to access billing management.',
        variant: 'destructive',
      });
      return;
    }

    setBillingPortalLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-billing-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Billing portal error:', error);
      toast({
        title: 'Unable to open billing portal',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setBillingPortalLoading(false);
    }
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
        return 'text-emerald-700 bg-emerald-50 border-emerald-300';
      case 'canceled':
        return 'text-red-700 bg-red-50 border-red-300';
      case 'past_due':
        return 'text-orange-700 bg-orange-50 border-orange-300';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-300';
    }
  };

  if (tierLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-hanok-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-midnight-ink-500">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-bold text-midnight-ink leading-tight mb-2 sm:mb-4">
              MY SUBSCRIPTION
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-midnight-ink-600 leading-relaxed">
              Manage your KStoryBridge subscription, billing, and premium features.
            </p>
          </div>
        </div>

      <div className="space-y-6">
          {/* Current Plan */}
          <Card className="bg-white border-gray-300 shadow-lg rounded-2xl mb-6 sm:mb-8 lg:mb-12">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-3 text-midnight-ink text-lg sm:text-xl">
                <div className={cn(
                  "p-2 rounded-lg",
                  tier === 'pro' ? 'bg-hanok-teal text-white' : 'bg-gray-200 text-midnight-ink-400'
                )}>
                  <Crown className="w-5 h-5" />
                </div>
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h5 className="font-semibold text-hanok-teal mb-1 text-sm sm:text-base">Current Plan</h5>
                    <p className="text-gray-600 text-xs sm:text-sm font-medium">
                      {tier === 'pro' ? 'KStoryBridge Pro' : 'KStoryBridge Basic'}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-hanok-teal mb-1 text-sm sm:text-base">Pricing</h5>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {tier === 'pro' ? '$250/month' : 'Free'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h5 className="font-semibold text-hanok-teal mb-1 text-sm sm:text-base">Access Level</h5>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {tier === 'pro'
                        ? 'Unlimited access to premium content and features'
                        : 'Access to basic features and limited content'
                      }
                    </p>
                  </div>
                  {tier !== 'pro' && (
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1 text-sm sm:text-base">Upgrade Options</h5>
                      <Button
                        onClick={() => window.location.href = '/buyers/pricing'}
                        className="border-gray-300 hover:bg-gray-100 font-medium px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base transition-colors"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Details */}
          {stripeData && tier === 'pro' && (
            <Card className="bg-white border-gray-300 shadow-lg rounded-2xl mb-6 sm:mb-8 lg:mb-12">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-3 text-midnight-ink text-lg sm:text-xl">
                  <div className="p-2 rounded-lg bg-hanok-teal/10 text-hanok-teal">
                    <Calendar className="w-5 h-5" />
                  </div>
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1 text-sm sm:text-base">Subscription Status</h5>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(stripeData.subscription_status)}`}>
                        {stripeData.subscription_status?.charAt(0).toUpperCase() + stripeData.subscription_status?.slice(1)}
                      </span>
                    </div>
                    {stripeData.stripe_customer_id && (
                      <div>
                        <h5 className="font-semibold text-hanok-teal mb-1 text-sm sm:text-base">Customer ID</h5>
                        <p className="text-gray-600 text-xs sm:text-sm font-mono">
                          {stripeData.stripe_customer_id}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1 text-sm sm:text-base">Next Billing Date</h5>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium">
                        {formatDate(stripeData.current_period_end)}
                      </p>
                    </div>
                    {stripeData.cancel_at_period_end && (
                      <div>
                        <h5 className="font-semibold text-hanok-teal mb-1 text-sm sm:text-base">Cancellation Status</h5>
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <div>
                              <p className="text-orange-700 text-xs sm:text-sm font-medium">
                                Subscription ends {formatDate(stripeData.current_period_end)}
                              </p>
                              <p className="text-orange-600 text-xs mt-1">
                                You'll continue to have Pro access until then.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing Management */}
          {stripeData && tier === 'pro' && (
            <Card className="bg-white border-gray-300 shadow-lg rounded-2xl mb-6 sm:mb-8 lg:mb-12">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-3 text-midnight-ink text-lg sm:text-xl">
                  <div className="p-2 rounded-lg bg-midnight-ink/10 text-midnight-ink">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  Billing Management
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1 text-sm sm:text-base">Billing Portal</h5>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        Manage your payment methods, view billing history, and update billing information through Stripe's secure portal.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1 text-sm sm:text-base">Actions</h5>
                      <Button
                        onClick={openBillingPortal}
                        disabled={billingPortalLoading}
                        className="border-gray-300 hover:bg-gray-100 font-medium px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base transition-colors"
                      >
                        {billingPortalLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Opening...
                          </div>
                        ) : (
                          <>
                            <Settings className="w-4 h-4 mr-2" />
                            Manage Billing
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features Overview */}
          <Card className="bg-white border-gray-300 shadow-lg rounded-2xl mb-6 sm:mb-8 lg:mb-12">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-midnight-ink text-lg sm:text-xl">Pro Features Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      tier === 'pro' ? 'bg-hanok-teal text-white' : 'bg-gray-200 text-gray-400'
                    )}>
                      {tier === 'pro' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-hanok-teal text-sm sm:text-base">Pitch Deck Access</h5>
                      <p className="text-gray-600 text-xs sm:text-sm mt-1">View detailed pitch presentations</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      tier === 'pro' ? 'bg-hanok-teal text-white' : 'bg-gray-200 text-gray-400'
                    )}>
                      {tier === 'pro' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-hanok-teal text-sm sm:text-base">Contact Rights Owners</h5>
                      <p className="text-gray-600 text-xs sm:text-sm mt-1">Direct creator communication</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      tier === 'pro' ? 'bg-hanok-teal text-white' : 'bg-gray-200 text-gray-400'
                    )}>
                      {tier === 'pro' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-hanok-teal text-sm sm:text-base">AI Chat Enhanced</h5>
                      <p className="text-gray-600 text-xs sm:text-sm mt-1">Personalized recommendations</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      tier === 'pro' ? 'bg-hanok-teal text-white' : 'bg-gray-200 text-gray-400'
                    )}>
                      {tier === 'pro' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-hanok-teal text-sm sm:text-base">Premium Content</h5>
                      <p className="text-gray-600 text-xs sm:text-sm mt-1">Full title information access</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;