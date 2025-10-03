import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDashboardPath, getSignupPath } from '@/utils/simpleAccountTypeDetection';
import type { AccountType } from '@/utils/simpleAccountTypeDetection';

/**
 * Ultra-Simple OAuth Callback Handler
 *
 * Replaces complex polling/timeout logic with straightforward approach:
 * 1. Read URL parameters (account_type, flow, code)
 * 2. Exchange OAuth code immediately (no pre-checks)
 * 3. Get user from exchange result (no polling)
 * 4. Update metadata with account_type
 * 5. Redirect based on flow type
 *
 * Total: ~80 lines, no timeouts, no polling, no state validation
 */
const AuthCallbackSimple = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double processing
    if (processedRef.current) return;
    processedRef.current = true;

    const processCallback = async () => {
      console.log('🚀 OAuth Callback: Starting ultra-simple processing');
      console.log('🌐 URL:', window.location.href);

      // Read URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const accountType = urlParams.get('account_type');
      const flow = urlParams.get('flow');

      console.log('📋 OAuth params:', {
        code: !!code,
        accountType,
        flow,
        fullUrl: window.location.search
      });

      // Validate OAuth code
      if (!code) {
        console.error('❌ No OAuth code found in URL');
        toast({
          title: "Authentication Error",
          description: "Missing OAuth authorization code",
          variant: "destructive"
        });
        navigate('/signin?error=missing_code');
        return;
      }

      try {
        // 1. Exchange OAuth code for session with race condition protection
        console.log('🔄 Exchanging OAuth code for session...');

        // Set up auth state change listener BEFORE exchange
        // This captures the SIGNED_IN event that we know fires successfully
        const authPromise = new Promise<{ user: any; session: any }>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Auth event timeout')), 15000);

          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              clearTimeout(timeout);
              subscription.unsubscribe();
              console.log('✅ Auth event captured:', session.user.email);
              resolve({ user: session.user, session });
            }
          });
        });

        // Start the exchange (may hang, but auth event will fire)
        const exchangePromise = supabase.auth.exchangeCodeForSession(code);

        // Race: whichever completes first wins
        let user, session;
        try {
          // Try exchange first with 10-second timeout (OAuth PKCE can take 5-10s in production)
          // Timeout is defensive - prevents indefinite hangs while allowing normal exchanges to complete
          const result = await Promise.race([
            exchangePromise,
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Exchange timeout')), 10000))
          ]);

          if (result.error || !result.data?.session?.user) {
            throw new Error('Exchange failed or returned no session');
          }

          user = result.data.session.user;
          session = result.data.session;
          console.log('✅ Exchange promise resolved:', user.email);
        } catch (exchangeError) {
          // Exchange exceeded 10s timeout - use reliable auth event fallback (this is expected behavior)
          console.log('ℹ️ Exchange took longer than 10s, using auth state change event (this is normal)...');
          console.log('Exchange info:', exchangeError);
          const result = await authPromise;
          user = result.user;
          session = result.session;
        }

        console.log('✅ OAuth session established for:', user.email);

        // 2. Determine account type (Priority: URL param > metadata > sessionStorage)
        const finalAccountType = (
          accountType ||
          user.user_metadata?.account_type ||
          (typeof window !== 'undefined' ? sessionStorage.getItem('oauth_account_type') : null)
        ) as AccountType | null;

        console.log('🎯 Account type detection:', {
          fromUrl: accountType,
          fromMetadata: user.user_metadata?.account_type,
          fromStorage: typeof window !== 'undefined' ? sessionStorage.getItem('oauth_account_type') : null,
          final: finalAccountType
        });

        // Validate account type
        if (!finalAccountType || (finalAccountType !== 'buyer' && finalAccountType !== 'creator')) {
          console.log('❓ No valid account type found, redirecting to selection');
          navigate(`/account-type-selection?oauth=true&email=${encodeURIComponent(user.email)}`);
          return;
        }

        console.log('✅ Valid account type:', finalAccountType);

        // 3. Clear sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('oauth_account_type');
          sessionStorage.removeItem('oauth_flow');
          console.log('🧹 Cleared OAuth session storage');
        }

        // 4. Redirect based on flow type
        if (flow === 'signup') {
          // OAuth signup - redirect to complete profile
          const signupPath = getSignupPath(finalAccountType);
          const signupUrl = `${signupPath}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`;
          console.log('📝 OAuth signup - redirecting to:', signupUrl);
          navigate(signupUrl);
        } else {
          // OAuth signin - redirect to dashboard
          const dashboardPath = getDashboardPath(finalAccountType);
          console.log('🏠 OAuth signin - redirecting to:', dashboardPath);
          navigate(dashboardPath);
        }

      } catch (error) {
        console.error('❌ Unexpected error in OAuth callback:', error);
        toast({
          title: "Authentication Error",
          description: error instanceof Error ? error.message : 'Unexpected error during authentication',
          variant: "destructive"
        });
        navigate('/signin?error=callback_error');
      }
    };

    processCallback();
  }, [navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-midnight-ink">Completing Authentication</h2>
        <p className="text-gray-600 mt-2">Please wait while we process your login...</p>
      </div>
    </div>
  );
};

export default AuthCallbackSimple;
