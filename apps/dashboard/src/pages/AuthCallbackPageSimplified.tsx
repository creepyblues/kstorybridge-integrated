import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getOAuthAccountType, getDashboardPath, getSignupPath } from '@/utils/simpleAccountTypeDetection';
import { markOAuthCompletion } from '@/utils/oauthFlowDetection';
import { trackOAuthCallbackError } from '@/services/authErrorTracking';

/**
 * Simplified OAuth Callback Handler - SINGLE METHOD APPROACH
 *
 * This replaces the over-engineered callback with ONE simple, reliable method:
 * 1. Exchange OAuth code for session (with reasonable timeout)
 * 2. Get account type from URL params or user metadata
 * 3. Redirect to appropriate destination
 *
 * NO multiple timeouts, polling, fallback chains, or competing session methods.
 * Fail fast with clear errors instead of complex defensive programming.
 */
const AuthCallbackPageSimplified = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent double processing
    if (processedRef.current) return;
    processedRef.current = true;

    const processOAuthCallback = async () => {
      console.log('🚀 OAuth Callback: Starting simplified processing');

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const accountType = urlParams.get('account_type');
        const flow = urlParams.get('flow');

        console.log('📋 OAuth params:', {
          hasCode: !!code,
          accountType,
          flow
        });

        // Validate required code parameter
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

        // 1. Exchange OAuth code for session - SINGLE ATTEMPT
        console.log('🔄 Exchanging OAuth code for session...');

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('❌ OAuth code exchange failed:', error.message);

          await trackOAuthCallbackError(
            error,
            'callback_exchange',
            {
              accountType: accountType as 'buyer' | 'creator' | undefined,
              oauthProvider: 'google',
              errorCode: (error as any).code
            }
          );

          toast({
            title: "Authentication Failed",
            description: error.message,
            variant: "destructive"
          });
          navigate('/signin?error=oauth_failed');
          return;
        }

        const session = data?.session;
        const user = session?.user;

        if (!session || !user) {
          console.error('❌ No session or user returned from OAuth exchange');

          await trackOAuthCallbackError(
            new Error('No session returned from OAuth exchange'),
            'session_init',
            {
              accountType: accountType as 'buyer' | 'creator' | undefined,
              oauthProvider: 'google',
              sessionValid: false
            }
          );

          toast({
            title: "Authentication Error",
            description: "Failed to establish session. Please try again.",
            variant: "destructive"
          });
          navigate('/signin?error=no_session');
          return;
        }

        console.log('✅ OAuth session established for:', user.email);

        // 2. Determine account type - SIMPLE LOGIC
        const detection = getOAuthAccountType(user, urlParams);
        const finalAccountType = detection.accountType;

        console.log('🎯 Account type detection:', {
          finalAccountType,
          source: detection.source
        });

        if (!finalAccountType) {
          console.log('❓ No account type found, redirecting to selection');
          const selectionUrl = `${window.location.origin}/account-type-selection?oauth=true&email=${encodeURIComponent(user.email ?? '')}`;
          window.location.assign(selectionUrl);
          return;
        }

        // 3. Update user metadata with account type
        console.log('🔄 Updating user metadata with account_type:', finalAccountType);

        try {
          await supabase.auth.updateUser({
            data: { account_type: finalAccountType }
          });
          console.log('✅ Metadata update successful');
        } catch (metadataError) {
          console.warn('⚠️ Metadata update failed (non-critical):', metadataError);
          // Don't fail the entire flow for metadata update issues
        }

        // 4. Mark OAuth completion
        markOAuthCompletion();

        // 5. Redirect based on flow type
        if (flow === 'signup') {
          // OAuth signup - redirect to complete profile
          const signupPath = getSignupPath(finalAccountType);
          const signupUrl = `${window.location.origin}${signupPath}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email ?? '')}`;
          console.log('📝 OAuth signup - redirecting to:', signupUrl);
          window.location.assign(signupUrl);
        } else {
          // OAuth signin - redirect to dashboard
          const dashboardUrl = `${window.location.origin}${getDashboardPath(finalAccountType)}`;
          console.log('🏠 OAuth signin - redirecting to:', dashboardUrl);
          window.location.assign(dashboardUrl);
        }

      } catch (error) {
        console.error('❌ Unexpected error in OAuth callback:', error);

        await trackOAuthCallbackError(
          error,
          'callback_unexpected',
          {
            oauthProvider: 'google',
            errorMessage: error instanceof Error ? error.message : 'Unexpected error'
          }
        );

        toast({
          title: "Authentication Error",
          description: "Something went wrong during authentication. Please try again.",
          variant: "destructive"
        });
        navigate('/signin?error=unexpected');
      }
    };

    processOAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center">
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

export default AuthCallbackPageSimplified;