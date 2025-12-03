import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { checkBuyerProfileExists } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

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
  }, []);

  async function handleOAuthCallback() {
    try {
      // 🚨 CRITICAL: Only use sessionStorage (no URL parameters per CLAUDE.md)
      const accountType = sessionStorage.getItem('oauth_account_type');
      const flow = sessionStorage.getItem('oauth_flow');

      console.log('🔄 OAuth callback processing', { accountType, flow });

      // Wait for Supabase's detectSessionInUrl to process the hash fragment
      // This is the production-proven pattern from Creator app
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get session (should be created by detectSessionInUrl)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('❌ OAuth session error:', sessionError);
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
        // Check if buyer profile exists
        const profileExists = await checkBuyerProfileExists(user.id);

        if (!profileExists) {
          clearOAuthStorage();
          toast({
            title: 'Account Not Found',
            description: 'Your account doesn\'t exist. Please sign up first.',
            variant: 'destructive',
          });
          // Immediate navigation - no setTimeout
          navigate('/signup');
          return;
        }

        // Profile exists - redirect to homepage
        clearOAuthStorage();
        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in',
        });
        navigate('/buyers/home');
      } else {
        // Signup flow - store user data in sessionStorage for CompleteProfile page
        sessionStorage.setItem('oauth_user_id', user.id);
        sessionStorage.setItem('oauth_user_email', user.email || '');

        // Clear OAuth flow storage
        clearOAuthStorage();

        // Navigate without URL parameters
        navigate('/signup/complete');
      }
    } catch (error: any) {
      console.error('❌ OAuth callback error', error);
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
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-400" />
        <h1 className="text-2xl font-semibold">Completing authentication...</h1>
        <p className="text-gray-600">Please wait while we sign you in</p>
      </div>
    </div>
  );
}
