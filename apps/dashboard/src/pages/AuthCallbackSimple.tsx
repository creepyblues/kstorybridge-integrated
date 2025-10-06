import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDashboardPath, getSignupPath } from '@/utils/oauthUtils';
import { validateOAuthState } from '@/utils/oauthSecurity';
import type { AccountType } from '@/utils/oauthUtils';

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
      const state = urlParams.get('state');

      console.log('📋 OAuth params:', {
        code: !!code,
        state: state?.substring(0, 8) + '...',
        fullUrl: window.location.search
      });

      // Validate OAuth state parameter (primary method)
      let accountType: string | null = null;
      let flow: string | null = null;

      if (state) {
        const oauthData = validateOAuthState(state);
        if (oauthData) {
          accountType = oauthData.accountType;
          flow = oauthData.flow;
          console.log('✅ OAuth state validated:', { accountType, flow, provider: oauthData.provider });
        } else {
          console.warn('⚠️ OAuth state validation failed, falling back to sessionStorage');
        }
      }

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
        // 1. Exchange OAuth code for session (simplified - no dual listener race condition)
        console.log('🔄 Exchanging OAuth code for session...');

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.session) {
          console.error('❌ OAuth code exchange failed:', error);
          toast({
            title: "Authentication Error",
            description: error?.message || 'Failed to exchange OAuth code',
            variant: "destructive"
          });
          navigate('/signin?error=oauth_exchange_failed');
          return;
        }

        const user = data.session.user;
        const session = data.session;

        console.log('✅ OAuth session established for:', user.email);

        // 2. Determine account type (Priority: state param > metadata > sessionStorage fallback)
        const finalAccountType = (
          accountType ||  // From validated OAuth state parameter
          user.user_metadata?.account_type ||
          (typeof window !== 'undefined' ? sessionStorage.getItem('oauth_account_type') : null)
        ) as AccountType | null;

        console.log('🎯 Account type detection:', {
          fromState: accountType,
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

        // 2.5. Update user metadata with account_type for consistency
        try {
          await supabase.auth.updateUser({
            data: { account_type: finalAccountType }
          });
          console.log('✅ User metadata updated with account_type:', finalAccountType);
        } catch (metadataError) {
          console.warn('⚠️ Failed to update user metadata (non-critical):', metadataError);
        }

        // 3. Clear sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('oauth_account_type');
          sessionStorage.removeItem('oauth_flow');
          console.log('🧹 Cleared OAuth session storage');
        }

        // 4. Redirect based on flow type (from state parameter or default to 'signin')
        const finalFlow = flow || 'signin';

        if (finalFlow === 'signup') {
          // OAuth signup - redirect to complete profile
          const signupPath = getSignupPath(finalAccountType);
          const signupUrl = `${signupPath}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`;
          console.log('📝 OAuth signup - redirecting to:', signupUrl);
          navigate(signupUrl);
        } else {
          // OAuth signin - check if profile exists before redirecting to dashboard
          console.log('🔍 OAuth signin - checking profile existence...');

          let profileExists = false;
          try {
            if (finalAccountType === 'buyer') {
              const { data } = await supabase
                .from('user_buyers')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();
              profileExists = !!data;
            } else if (finalAccountType === 'creator') {
              const { data } = await supabase
                .from('user_creators')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();
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
