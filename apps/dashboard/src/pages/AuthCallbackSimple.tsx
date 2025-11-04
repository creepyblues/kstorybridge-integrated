import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, withRetry } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDashboardPath, getSignupPath } from '@/utils/oauthUtils';
import type { AccountType } from '@/utils/oauthUtils';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Ultra-Simple OAuth Callback Handler
 *
 * Replaces complex polling/timeout logic with straightforward approach:
 * 1. Read OAuth code and state parameter (contains account_type and flow)
 * 2. Exchange OAuth code immediately (no pre-checks)
 * 3. Get user from exchange result (no polling)
 * 4. Redirect based on flow type
 *
 * Uses OAuth state parameter for passing data (no custom URL parameters)
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

      // Read OAuth code from URL (only the code, no custom parameters)
      // ✅ CRITICAL: NO custom URL parameters in OAuth callback (per CLAUDE.md)
      // Data is passed via sessionStorage only
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      console.log('📋 OAuth params:', {
        code: !!code,
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
        const authPromise = new Promise<{ user: User; session: Session }>((resolve, reject) => {
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

        // 2. Determine account type - Dashboard app now only handles BUYER auth
        // NO URL parameters used (per CLAUDE.md critical rule)
        // Always default to 'buyer' (creator auth moved to creator app)
        const finalAccountType: AccountType = 'buyer';

        console.log('🎯 Account type: buyer (dashboard app buyer-only mode)');

        // Note: Metadata update removed - not required for OAuth flow
        // RootRedirect.tsx has fallback logic that checks database tables if metadata is missing
        // Database tables are the source of truth, not metadata

        // 3. Determine flow type (Priority: sessionStorage > default 'signin')
        // NO URL parameters used (per CLAUDE.md critical rule)
        const finalFlow = (
          (typeof window !== 'undefined' ? sessionStorage.getItem('oauth_flow') : null) ||
          'signin'
        ) as 'signin' | 'signup';

        console.log('🎯 Flow type detection:', {
          fromStorage: typeof window !== 'undefined' ? sessionStorage.getItem('oauth_flow') : null,
          final: finalFlow
        });

        // 4. Clear initial OAuth sessionStorage (will be replaced with completion data if signup)
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('oauth_account_type');
          sessionStorage.removeItem('oauth_flow');
          console.log('🧹 Cleared initial OAuth session storage');
        }

        // 5. Redirect based on flow type

        if (finalFlow === 'signup') {
          // OAuth signup - redirect to complete profile
          // Store completion data in sessionStorage (NO URL parameters per CLAUDE.md)
          sessionStorage.setItem('oauth_signup_complete', 'true');
          sessionStorage.setItem('oauth_user_id', user.id);
          sessionStorage.setItem('oauth_user_email', user.email);
          sessionStorage.setItem('oauth_user_account_type', finalAccountType);

          const signupPath = getSignupPath(finalAccountType);
          console.log('📝 OAuth signup - redirecting to:', signupPath);
          navigate(signupPath);
        } else {
          // OAuth signin - VERIFY PROFILE EXISTS BEFORE REDIRECTING
          // This prevents authenticated users without profiles from reaching dashboard
          console.log('✅ OAuth signin - verifying profile existence before redirect');

          try {
            // Check if buyer profile exists in database
            let profileExists = false;
            let profileCheckError: string | null = null;

            const { data, error } = await withRetry(
              () => supabase
                .from('user_buyers')
                .select('id')
                .eq('id', user.id)
                .maybeSingle(),
              { maxRetries: 2, delay: 500 }
            );

            if (error) {
              console.error('❌ OAuth signin: Error checking buyer profile:', error);
              profileCheckError = error.message;
            } else {
              profileExists = !!data;
              console.log(profileExists ? '✅ Buyer profile found' : '❌ No buyer profile found');
            }

            if (profileCheckError) {
              // Database error - show error and redirect to signin
              console.error('❌ OAuth signin: Profile check failed with database error');
              toast({
                title: "Connection Error",
                description: "Unable to verify your profile. Please try signing in again.",
                variant: "destructive"
              });
              navigate('/signin?error=profile_check_error');
              return;
            }

            if (!profileExists) {
              // No profile found - this is first-time OAuth "signin" (should be signup)
              // Redirect to signup to complete profile
              console.log('❌ OAuth signin: No profile found - redirecting to signup');

              toast({
                title: "Welcome!",
                description: "Please complete your profile to get started.",
                variant: "default"
              });

              // Set signup completion flags (reuse signup flow)
              sessionStorage.setItem('oauth_signup_complete', 'true');
              sessionStorage.setItem('oauth_user_id', user.id);
              sessionStorage.setItem('oauth_user_email', user.email);
              sessionStorage.setItem('oauth_user_account_type', finalAccountType);

              const signupPath = getSignupPath(finalAccountType);
              console.log('📝 Redirecting to signup:', signupPath);
              navigate(signupPath);
              return;
            }

            // Profile exists - proceed to dashboard
            console.log('✅ OAuth signin: Profile verified - proceeding to dashboard');

            const dashboardPath = getDashboardPath(finalAccountType);
            console.log('🔄 Redirecting to dashboard:', dashboardPath);
            navigate(dashboardPath);

          } catch (error) {
            console.error('❌ OAuth signin: Unexpected error during profile check:', error);
            toast({
              title: "Authentication Error",
              description: "Unable to verify your profile. Please try signing in again.",
              variant: "destructive"
            });
            navigate('/signin?error=profile_check_exception');
          }
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
