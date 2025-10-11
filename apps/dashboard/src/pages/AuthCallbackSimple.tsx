import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, withRetry } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDashboardPath, getSignupPath } from '@/utils/oauthUtils';
import type { AccountType } from '@/utils/oauthUtils';

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

      // Read URL parameters (OAuth code and state)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const stateParam = urlParams.get('state');

      // Parse OAuth state parameter (contains account_type and flow)
      let accountType: string | null = null;
      let flow: string | null = null;

      if (stateParam) {
        try {
          const state = JSON.parse(stateParam);
          accountType = state.account_type;
          flow = state.flow;
          console.log('✅ Parsed OAuth state parameter:', { accountType, flow });
        } catch (error) {
          console.warn('⚠️ Failed to parse OAuth state parameter:', error);
        }
      }

      console.log('📋 OAuth params:', {
        code: !!code,
        accountType,
        flow,
        stateParam: !!stateParam,
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

        // 2. Determine account type (Priority: OAuth state > metadata > sessionStorage fallback)
        const finalAccountType = (
          accountType ||  // From OAuth state parameter
          user.user_metadata?.account_type ||
          (typeof window !== 'undefined' ? sessionStorage.getItem('oauth_account_type') : null)
        ) as AccountType | null;

        console.log('🎯 Account type detection:', {
          fromOAuthState: accountType,
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

        // Note: Metadata update removed - not required for OAuth flow
        // RootRedirect.tsx has fallback logic that checks database tables if metadata is missing
        // Database tables are the source of truth, not metadata

        // 3. Determine flow type (Priority: OAuth state > sessionStorage > default 'signin')
        const finalFlow = (
          flow ||
          (typeof window !== 'undefined' ? sessionStorage.getItem('oauth_flow') : null) ||
          'signin'
        ) as 'signin' | 'signup';

        console.log('🎯 Flow type detection:', {
          fromOAuthState: flow,
          fromStorage: typeof window !== 'undefined' ? sessionStorage.getItem('oauth_flow') : null,
          final: finalFlow
        });

        // 4. Clear sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('oauth_account_type');
          sessionStorage.removeItem('oauth_flow');
          console.log('🧹 Cleared OAuth session storage');
        }

        // 5. Redirect based on flow type

        if (finalFlow === 'signup') {
          // OAuth signup - redirect to complete profile
          const signupPath = getSignupPath(finalAccountType);
          const signupUrl = `${signupPath}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`;
          console.log('📝 OAuth signup - redirecting to:', signupUrl);

          // Mark OAuth completion time for extended timeout detection
          sessionStorage.setItem('oauth_completed_at', Date.now().toString());
          navigate(signupUrl);
        } else {
          // OAuth signin - check if profile exists before redirecting to dashboard
          console.log('🔍 OAuth signin - checking profile existence...');

          let profileExists = false;
          try {
            if (finalAccountType === 'buyer') {
              const { data } = await withRetry(
                () => supabase
                  .from('user_buyers')
                  .select('id')
                  .eq('id', user.id)
                  .maybeSingle(),
                {
                  maxRetries: 2,
                  timeoutMs: 10000, // 10 second timeout for mobile compatibility
                  operationName: 'check-buyer-profile-existence'
                }
              );
              profileExists = !!data;
            } else if (finalAccountType === 'creator') {
              const { data } = await withRetry(
                () => supabase
                  .from('user_creators')
                  .select('id')
                  .eq('id', user.id)
                  .maybeSingle(),
                {
                  maxRetries: 2,
                  timeoutMs: 10000, // 10 second timeout for mobile compatibility
                  operationName: 'check-creator-profile-existence'
                }
              );
              profileExists = !!data;
            }
          } catch (error) {
            console.error('❌ Error checking profile existence:', error);
            // On error, assume profile doesn't exist for safety
            profileExists = false;
          }

          if (profileExists) {
            // Profile exists - proceed to dashboard
            const dashboardPath = getDashboardPath(finalAccountType);
            console.log('✅ Profile found - redirecting to:', dashboardPath);

            // Mark OAuth completion time for extended timeout detection
            sessionStorage.setItem('oauth_completed_at', Date.now().toString());

            // Check if this is the first login in this session
            const isFirstLogin = !sessionStorage.getItem('dashboard_loaded');

            if (isFirstLogin) {
              // Mark dashboard as loaded for this session
              sessionStorage.setItem('dashboard_loaded', 'true');
              console.log('🔄 First login detected - will reload dashboard after navigation');

              // Navigate first, then reload to ensure fresh state
              navigate(dashboardPath);

              // Small delay to allow navigation to complete, then reload
              setTimeout(() => {
                console.log('🔄 Reloading dashboard for fresh state...');
                window.location.reload();
              }, 100);
            } else {
              // Normal navigation without reload
              navigate(dashboardPath);
            }
          } else {
            // No profile found - user needs to signup first
            console.log('❌ No profile found - redirecting to signup');
            toast({
              title: "Account Not Found",
              description: "Your account doesn't exist. Please sign up first.",
              variant: "destructive"
            });
            setTimeout(() => {
              navigate(`/signup/${finalAccountType}`);
            }, 2000);
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
