import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { lookupBuyerProfile } from '@/lib/auth';
import { Icon } from '@iconify/react';
import { notifyUserSignin } from '@/utils/slack';
import { trackSignin, trackSignup } from '@/utils/analytics';
import { consumePostAuthRedirect } from '@/lib/postAuthRedirect';

// 🚨 AUTH ISOLATION BOUNDARY
// This page handles OAuth callback only - no business logic

const CALLBACK_TIMEOUT_MS = 15000; // 15 seconds max for entire callback flow

/**
 * Clear OAuth sessionStorage
 * Called on BOTH success and error to prevent state leakage
 */
function clearOAuthStorage() {
  sessionStorage.removeItem('oauth_account_type');
  sessionStorage.removeItem('oauth_flow');
  // DO NOT clear redirect_after_login — consumed at final destination
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set global timeout for entire callback flow
    const timeoutId = setTimeout(() => {
      clearOAuthStorage();
      setError('Authentication timed out. Please try again.');
    }, CALLBACK_TIMEOUT_MS);

    handleOAuthCallback().finally(() => {
      clearTimeout(timeoutId);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Hand an authenticated-but-profileless Google user to CompleteProfile.
   * Used by the signup flow and by sign-in when no buyer profile exists yet.
   * redirect_after_login is intentionally left in place for CompleteProfile.
   */
  function continueAsSignup(user: { id: string; email?: string | null }) {
    sessionStorage.setItem('oauth_user_id', user.id);
    sessionStorage.setItem('oauth_user_email', user.email || '');
    clearOAuthStorage();
    // Navigate without URL parameters
    navigate('/signup/complete');
  }

  async function handleOAuthCallback() {
    const accountType = sessionStorage.getItem('oauth_account_type');
    const flow = sessionStorage.getItem('oauth_flow');

    try {
      // 🚨 CRITICAL: Only use sessionStorage (no URL parameters per CLAUDE.md)
      console.log('🔄 OAuth callback processing', { accountType, flow });

      // Wait for Supabase's detectSessionInUrl to process the hash fragment
      // This is the production-proven pattern from Creator app
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get session (should be created by detectSessionInUrl)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('❌ OAuth session error:', sessionError);
        if (flow === 'signup') {
          trackSignup('failed', 'google', { failure_reason: 'oauth_session_failed' });
        } else {
          trackSignin('failed', 'google', { failure_reason: 'oauth_session_failed' });
        }
        clearOAuthStorage();
        setError('Authentication failed. Please try again.');
        return;
      }

      const user = session.user;
      console.log('✅ OAuth session established', { userId: user.id, email: user.email });

      // If sessionStorage was cleared (e.g., browser behavior), default to signin flow
      // This is safe because we check profile existence anyway
      const effectiveAccountType = accountType || 'buyer';
      const effectiveFlow = flow || 'signin';

      console.log('🔄 Using effective flow', { effectiveAccountType, effectiveFlow });

      // Handle based on flow
      if (effectiveFlow === 'signin') {
        const profile = await lookupBuyerProfile(user.id);

        if (profile === 'error') {
          // Lookup failed (timeout / query error). The user may well have a profile;
          // never send them into profile creation on a guess.
          trackSignin('failed', 'google', { failure_reason: 'profile_lookup_failed' });
          clearOAuthStorage();
          setError('We couldn\'t verify your account just now. Please try signing in again.');
          return;
        }

        if (profile === 'missing') {
          // Google already authenticated them; bouncing to /signup for a second
          // Google click looks like a bug. Continue straight into profile completion.
          trackSignup('attempted', 'google');
          toast({
            title: 'Almost there',
            description: 'Tell us a bit about yourself to finish creating your account.',
          });
          continueAsSignup(user);
          return;
        }

        // Profile exists - redirect to homepage
        trackSignin('completed', 'google');
        clearOAuthStorage();

        // Send Slack notification (non-blocking)
        notifyUserSignin({
          email: user.email || '',
          authType: 'google',
        }).catch(console.warn);

        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in',
          variant: 'success',
        });
        // Email-verification links open in a new tab (empty sessionStorage), so fall
        // back to the destination stored in user metadata at signup.
        const metaRedirect = user.user_metadata?.redirect_after_login;
        const redirectUrl = consumePostAuthRedirect(metaRedirect);
        if (metaRedirect) {
          // One-shot: don't send them back to that title on every future sign-in
          supabase.auth.updateUser({ data: { redirect_after_login: null } }).catch(console.warn);
        }
        navigate(redirectUrl);
      } else {
        continueAsSignup(user);
      }
    } catch (error: any) {
      console.error('❌ OAuth callback error', error);
      if (flow === 'signup') {
        trackSignup('failed', 'google', { failure_reason: 'oauth_callback_failed' });
      } else {
        trackSignin('failed', 'google', { failure_reason: 'oauth_callback_failed' });
      }
      clearOAuthStorage();
      setError(error.message || 'Authentication failed');
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/signin')}
            className="text-blue-600 underline hover:text-blue-700"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4">
        <Icon icon="solar:refresh-circle-bold-duotone" className="h-12 w-12 animate-spin mx-auto text-gray-400" />
        <h1 className="text-2xl font-semibold">Completing authentication...</h1>
        <p className="text-gray-600">Please wait while we sign you in</p>
      </div>
    </div>
  );
}
