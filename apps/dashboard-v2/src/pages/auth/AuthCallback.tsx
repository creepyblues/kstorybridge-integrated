import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { checkBuyerProfileExists } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  async function handleOAuthCallback() {
    try {
      // Get code from URL
      const code = searchParams.get('code');
      const accountType = searchParams.get('account_type') || sessionStorage.getItem('oauth_account_type');
      const flow = searchParams.get('flow') || sessionStorage.getItem('oauth_flow');

      if (!code) {
        setError('No authorization code found');
        return;
      }

      console.log('🔄 OAuth callback processing', { accountType, flow });

      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('❌ Code exchange error', exchangeError);
        setError(exchangeError.message);
        return;
      }

      if (!data.session) {
        setError('No session returned from OAuth');
        return;
      }

      const user = data.session.user;
      console.log('✅ OAuth session established', { userId: user.id, email: user.email });

      // Clear sessionStorage
      sessionStorage.removeItem('oauth_account_type');
      sessionStorage.removeItem('oauth_flow');

      // Validate account type
      if (!accountType || accountType !== 'buyer') {
        setError('Invalid account type');
        return;
      }

      // Handle based on flow
      if (flow === 'signin') {
        // Check if buyer profile exists
        const profileExists = await checkBuyerProfileExists(user.id);

        if (!profileExists) {
          toast({
            title: 'Account Not Found',
            description: 'Your account doesn\'t exist. Please sign up first.',
            variant: 'destructive',
          });

          setTimeout(() => {
            navigate('/signup');
          }, 2000);
          return;
        }

        // Profile exists - redirect to dashboard
        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in',
        });

        navigate('/buyers/chat');
      } else {
        // Signup flow - redirect to complete profile
        navigate(`/signup/complete?user_id=${user.id}&email=${user.email}`);
      }
    } catch (error: any) {
      console.error('❌ OAuth callback error', error);
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
