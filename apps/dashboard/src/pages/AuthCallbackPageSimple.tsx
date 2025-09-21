import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getOAuthAccountType } from '@/utils/simpleAccountTypeDetection';

/**
 * Simple OAuth Callback Handler
 *
 * Replaces the over-engineered callback with a straightforward approach:
 * 1. Exchange code for session
 * 2. Get account type from URL params
 * 3. Redirect appropriately
 */
const AuthCallbackPageSimple = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const handleOAuthCallback = async () => {
      console.log('🚀 Simple OAuth Callback: Starting processing');
      console.log('🌐 Current URL:', window.location.href);

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const flow = urlParams.get('flow') || 'signin';
        const urlAccountType = urlParams.get('account_type');

        console.log('📋 URL Parameters:', {
          code: code ? `${code.substring(0, 8)}...` : null,
          flow,
          accountType: urlAccountType
        });

        if (!code) {
          console.error('❌ No OAuth code found');
          navigate('/signin?error=no_code');
          return;
        }

        console.log('🔄 Exchanging OAuth code for session...');

        // Use a fallback approach: try direct exchange but also listen for auth state changes
        let exchangeCompleted = false;
        let sessionData = null;
        let exchangeError = null;

        // Listen for successful auth state change as a fallback
        const authPromise = new Promise((resolve) => {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user && !exchangeCompleted) {
              console.log('🎯 Detected successful signin via auth state change');
              exchangeCompleted = true;
              subscription.unsubscribe();
              resolve({ data: { session, user: session.user }, error: null });
            }
          });

          // Auto-cleanup after 15 seconds
          setTimeout(() => {
            if (!exchangeCompleted) {
              subscription.unsubscribe();
              resolve({ data: null, error: new Error('Auth state change timeout') });
            }
          }, 15000);
        });

        // Try direct exchange
        const exchangePromise = supabase.auth.exchangeCodeForSession(code)
          .then(result => {
            exchangeCompleted = true;
            return result;
          })
          .catch(err => {
            console.warn('🔄 Direct exchange failed, relying on auth state change:', err);
            return { data: null, error: err };
          });

        // Race between direct exchange and auth state detection
        const result = await Promise.race([exchangePromise, authPromise]);
        const { data, error } = result as any;

        console.log('🔄 Exchange result received:', {
          hasData: !!data,
          hasSession: !!data?.session,
          hasUser: !!data?.session?.user,
          hasError: !!error,
          errorMessage: error?.message
        });

        if (error) {
          console.error('❌ OAuth exchange failed:', error);
          toast({
            title: "Authentication Failed",
            description: error.message,
            variant: "destructive"
          });
          navigate('/signin?error=oauth_failed');
          return;
        }

        if (!data.session?.user) {
          console.error('❌ No user in session after exchange');
          navigate('/signin?error=no_user');
          return;
        }

        const user = data.session.user;
        console.log('✅ OAuth exchange successful for:', user.email);

        // Get account type from URL params (set during OAuth initiation)
        const detection = getOAuthAccountType(user, urlParams);
        const accountType = detection.accountType;

        console.log('🎯 Account type detected:', accountType, 'from source:', detection.source);

        if (!accountType) {
          console.error('❌ No account type determined');
          navigate('/signin?error=no_account_type');
          return;
        }

        // Update user metadata
        try {
          await supabase.auth.updateUser({
            data: { account_type: accountType }
          });
        } catch (updateError) {
          console.warn('⚠️ Failed to update user metadata:', updateError);
        }

        // Route based on flow
        if (flow === 'signup') {
          // OAuth signup - redirect to complete profile
          const signupUrl = `/signup/${accountType}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email || '')}`;
          console.log('📝 Redirecting to signup completion:', signupUrl);
          navigate(signupUrl);
        } else {
          // OAuth signin - redirect to dashboard
          const dashboardUrl = `/${accountType}s/home`;
          console.log('🏠 Redirecting to dashboard:', dashboardUrl);
          navigate(dashboardUrl);
        }

      } catch (error) {
        console.error('❌ Unexpected error in OAuth callback:', error);
        toast({
          title: "Authentication Error",
          description: "Something went wrong during authentication. Please try again.",
          variant: "destructive"
        });
        navigate('/signin?error=unexpected');
      }
    };

    handleOAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-midnight-ink mb-2">
          Completing Authentication
        </h2>
        <p className="text-midnight-ink-600">
          Please wait while we process your login...
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPageSimple;