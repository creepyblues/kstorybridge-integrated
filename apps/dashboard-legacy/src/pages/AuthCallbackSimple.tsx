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
        const startTime = Date.now();
        console.log('🔄 Exchanging OAuth code for session...');
        console.log('⏱️ Start time:', new Date(startTime).toISOString());

        // Set up auth state change listener BEFORE exchange
        // This captures the SIGNED_IN event that we know fires successfully
        const authPromise = new Promise<{ user: User; session: Session }>((resolve, reject) => {
          const authStartTime = Date.now();
          const timeout = setTimeout(() => {
            const duration = Date.now() - authStartTime;
            console.error(`❌ Auth event timeout after ${duration}ms (45s limit)`);
            reject(new Error(`Auth event timeout after ${duration}ms`));
          }, 45000); // Increased from 15s to 45s

          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              const duration = Date.now() - authStartTime;
              clearTimeout(timeout);
              subscription.unsubscribe();
              console.log(`✅ Auth event captured: ${session.user.email} (took ${duration}ms)`);
              resolve({ user: session.user, session });
            }
          });
        });

        // Start the exchange
        const exchangeStartTime = Date.now();
        const exchangePromise = supabase.auth.exchangeCodeForSession(code);

        // Race BOTH the exchange AND the auth event - whichever completes first wins
        let user, session;
        let completionMethod = 'unknown';

        try {
          // Race between THREE outcomes:
          // 1. Exchange completes successfully
          // 2. Auth event fires (reliable fallback)
          // 3. Both timeout after 45s (maximum wait time)
          const result = await Promise.race([
            // Option 1: Exchange promise
            exchangePromise.then(result => {
              const duration = Date.now() - exchangeStartTime;
              console.log(`✅ Exchange completed first (${duration}ms)`);
              completionMethod = 'exchange';
              if (result.error || !result.data?.session?.user) {
                throw new Error('Exchange succeeded but returned no session');
              }
              return { user: result.data.session.user, session: result.data.session };
            }),

            // Option 2: Auth event listener (already set up above)
            authPromise.then(result => {
              const duration = Date.now() - exchangeStartTime;
              console.log(`✅ Auth event completed first (${duration}ms)`);
              completionMethod = 'auth_event';
              return result;
            }),

            // Option 3: Maximum timeout (45s) - should never happen with auth event
            new Promise<never>((_, reject) => setTimeout(() => {
              const duration = Date.now() - exchangeStartTime;
              console.error(`❌ Both exchange and auth event timed out after ${duration}ms`);
              reject(new Error(`Complete timeout after ${duration}ms`));
            }, 45000))
          ]);

          user = result.user;
          session = result.session;
          const totalDuration = Date.now() - exchangeStartTime;
          console.log(`✅ Session obtained via ${completionMethod} (${totalDuration}ms)`);
        } catch (error) {
          const duration = Date.now() - exchangeStartTime;
          console.error(`❌ All methods failed after ${duration}ms:`, error);
          throw error;
        }

        const totalDuration = Date.now() - startTime;
        console.log(`✅ OAuth session established for: ${user.email} (total time: ${totalDuration}ms)`);

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
          // OAuth signin - redirect to dashboard directly
          // Profile existence check will happen on the dashboard page itself via RootRedirect
          // (Attempting to check during OAuth callback causes RLS timing issues in localhost/production)
          console.log('✅ OAuth signin - redirecting to dashboard (profile check delegated to RootRedirect)');

          const dashboardPath = getDashboardPath(finalAccountType);
          console.log('🔄 Redirecting to dashboard:', dashboardPath);
          navigate(dashboardPath);
        }

      } catch (error) {
        const errorDuration = Date.now() - (error instanceof Error && error.message.includes('timeout') ? 0 : Date.now());
        console.error('❌ Unexpected error in OAuth callback:', error);

        // Enhanced error message with timing context
        let errorDescription = 'Unexpected error during authentication';
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorDescription = `Authentication timed out: ${error.message}. This may be due to slow network or high server load. Please try again.`;
          } else {
            errorDescription = error.message;
          }
        }

        toast({
          title: "Authentication Error",
          description: errorDescription,
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
