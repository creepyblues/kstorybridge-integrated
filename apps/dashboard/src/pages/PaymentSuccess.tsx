import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button, Card, CardContent } from '@kstorybridge/ui';
import { CheckCircle, ArrowRight, Crown, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTierAccess } from '@/hooks/useTierAccess';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user } = useAuth();
  const { tier, loading, refreshTier } = useTierAccess();
  const { toast } = useToast();

  const [isVerified, setIsVerified] = useState(false);
  const [isUpdatingTier, setIsUpdatingTier] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Debug logging for payment success
  useEffect(() => {
    console.log('🎯 PaymentSuccess Debug:', {
      sessionId,
      userId: user?.id,
      userEmail: user?.email,
      currentTier: tier,
      loading,
      timestamp: new Date().toISOString()
    });
  }, [sessionId, user, tier, loading]);

  // Verify payment and attempt to update tier
  useEffect(() => {
    const verifyPaymentAndUpdateTier = async () => {
      if (!sessionId || !user) {
        console.warn('⚠️ PaymentSuccess: Missing sessionId or user');
        return;
      }

      setIsVerified(true);

      // Wait a bit for webhook to process
      setTimeout(async () => {
        await checkAndUpdateTier();
      }, 2000); // Wait 2 seconds for webhook
    };

    verifyPaymentAndUpdateTier();
  }, [sessionId, user]);

  // Function to check current tier and update if needed
  const checkAndUpdateTier = async () => {
    if (!user?.id) return;

    try {
      console.log('🔍 PaymentSuccess: Checking current tier for user:', user.id);

      // Check current tier in database
      const { data: userBuyer, error: buyerError } = await supabase
        .from('user_buyers')
        .select('tier')
        .eq('id', user.id)
        .single();

      // Check stripe subscription status
      const { data: stripeCustomer, error: stripeError } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const debugData = {
        userBuyer,
        stripeCustomer,
        buyerError,
        stripeError,
        timestamp: new Date().toISOString()
      };

      setDebugInfo(debugData);
      console.log('🔍 PaymentSuccess Debug Data:', debugData);

      // More lenient tier checking - give webhook time to process
      const hasActiveSubscription = stripeCustomer?.subscription_status === 'active' ||
                                    stripeCustomer?.subscription_status === 'trialing';

      if (userBuyer?.tier === 'pro' && hasActiveSubscription) {
        console.log('✅ Pro tier confirmed with active subscription');
        // Force refresh the tier access hook to pick up changes
        if (refreshTier) {
          await refreshTier();
        }
      } else if (userBuyer?.tier === 'pro' && !stripeCustomer) {
        console.log('⏳ Pro tier in database, subscription record still processing');
        // Keep checking, but don't immediately downgrade
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          setTimeout(checkAndUpdateTier, 4000); // Longer delay for webhook processing
        }
      } else if (userBuyer?.tier === 'basic' && hasActiveSubscription) {
        console.log('🔄 Active subscription found but tier is basic - updating to pro...');
        await manualTierUpdate();
      } else if (userBuyer?.tier === 'pro' && !hasActiveSubscription && stripeCustomer) {
        console.warn('⚠️ Pro tier but subscription not active:', stripeCustomer.subscription_status);
        // Let the tier access hook handle this validation
        if (refreshTier) {
          await refreshTier();
        }
      } else if (retryCount < maxRetries) {
        console.log(`⏳ Waiting for webhook processing, retry ${retryCount + 1}/${maxRetries}`);
        setRetryCount(prev => prev + 1);
        // Progressive backoff: 3s, 6s, 9s
        setTimeout(checkAndUpdateTier, 3000 * (retryCount + 1));
      } else {
        console.warn('⚠️ Max retries reached, tier may need manual verification');
        toast({
          title: "Account update in progress",
          description: "Your Pro features may take a few minutes to activate. Please refresh if needed.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('❌ Error checking tier:', error);
      toast({
        title: "Error checking account status",
        description: "Please refresh the page or contact support if the issue persists.",
        variant: "destructive"
      });
    }
  };

  // Manual tier update fallback
  const manualTierUpdate = async () => {
    if (!user?.id || isUpdatingTier) return;

    setIsUpdatingTier(true);
    try {
      console.log('🔧 Manually updating tier to pro for user:', user.id);

      const { error } = await supabase
        .from('user_buyers')
        .update({ tier: 'pro' })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Manual tier update failed:', error);
        toast({
          title: "Failed to update account",
          description: "Please contact support to activate your Pro features.",
          variant: "destructive"
        });
      } else {
        console.log('✅ Manual tier update successful');
        toast({
          title: "Account Updated!",
          description: "Your Pro features are now active.",
          variant: "default"
        });

        // Force refresh the tier
        if (refreshTier) {
          await refreshTier();
        }
      }
    } catch (error) {
      console.error('❌ Exception during manual tier update:', error);
      toast({
        title: "Update failed",
        description: "An error occurred while updating your account.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingTier(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-hanok-teal/5 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-hanok-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hanok-teal/5 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white shadow-2xl rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-hanok-teal to-emerald-600 p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm">
                  <CheckCircle className="w-16 h-16 text-white animate-bounce" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Crown className="w-8 h-8 text-yellow-300 animate-pulse" />
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome to Pro! 🎉
            </h2>
            <p className="text-xl text-white/90">
              Your payment was successful and you're now a Pro member
            </p>
          </div>

          {/* Content Section */}
          <div className="p-8 space-y-8">
            {/* Tier Confirmation */}
            {tier === 'pro' ? (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-2 rounded-full">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-800">
                      Pro Tier Activated! ✅
                    </h3>
                    <p className="text-green-600 text-sm">
                      Your account has been upgraded and all Pro features are now available
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500 p-2 rounded-full">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800">
                      Account Update in Progress...
                    </h3>
                    <p className="text-yellow-700 text-sm mb-3">
                      Your payment was successful! We're updating your account to Pro tier.
                      {retryCount > 0 && ` (Attempt ${retryCount}/${maxRetries})`}
                    </p>
                    <Button
                      onClick={checkAndUpdateTier}
                      disabled={isUpdatingTier}
                      variant="outline"
                      size="sm"
                      className="border-yellow-500 text-yellow-700 hover:bg-yellow-100"
                    >
                      {isUpdatingTier ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Refresh Status
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Information (only show if there are issues) */}
            {debugInfo && tier !== 'pro' && (
              <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  Debug Information (Click to expand)
                </summary>
                <pre className="mt-3 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-48">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}

            {/* Pro Features */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-midnight-ink">
                You now have access to:
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500 p-2 rounded-lg">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-800">Pitch Deck Access</h4>
                      <p className="text-purple-600 text-sm">View detailed pitch decks for all titles</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-800">Contact Rights Owners</h4>
                      <p className="text-blue-600 text-sm">Direct contact with content creators</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 p-2 rounded-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-800">AI Chat Enhanced</h4>
                      <p className="text-emerald-600 text-sm">Personalized recommendations and insights</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500 p-2 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-800">Premium Content</h4>
                      <p className="text-orange-600 text-sm">Full access to all title information</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/buyers/titles" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-hanok-teal to-emerald-600 hover:from-hanok-teal/90 hover:to-emerald-700 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  Explore Pro Content
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <Link to="/buyers/plan" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-2 border-hanok-teal text-hanok-teal hover:bg-hanok-teal hover:text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300"
                >
                  Manage Subscription
                </Button>
              </Link>
            </div>

            {/* Support */}
            <div className="text-center text-gray-600">
              <p>
                Need help? <Link to="/contact" className="text-hanok-teal hover:underline">Contact our support team</Link>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;