import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { Card, CardContent } from '@kstorybridge/ui';
import { useToast } from '@/hooks/use-toast';
import { supabase, performSupabaseHealthCheck } from '@/integrations/supabase/client';
import { performSessionHealthCheck, getCurrentSession, recoverCorruptedSession } from '@/utils/sessionManager';
import { determineAccountType, clearAccountTypeCache, getAccountTypeDisplayInfo } from '@/utils/accountTypeDetection';
import { notifyUserSignin } from '@/utils/slack';
import { createBuyerProfileAtomic } from '@/utils/atomicProfileCreator';

interface SigninFormProps {
  accountType: 'buyer' | 'creator';
}

const SigninForm = ({ accountType }: SigninFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showEmailVerificationAlert, setShowEmailVerificationAlert] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [signinError, setSigninError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is coming from signup and show verification reminder
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromSignup = urlParams.get('from') === 'signup';
    const emailParam = urlParams.get('email');
    const signedOut = urlParams.get('signed_out') === 'true';
    const verified = urlParams.get('verified') === 'true';

    // Check if coming from email verification
    if (verified) {
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified. You can now sign in to your account.",
        duration: 8000
      });
    }

    if (fromSignup && emailParam) {
      setUnverifiedEmail(emailParam);
      setFormData(prev => ({ ...prev, email: emailParam }));
      setShowEmailVerificationAlert(true);
    }

    if (signedOut) {
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
        duration: 4000
      });
    }
  }, [toast]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);

    try {
      // Account-specific OAuth redirect (clean pattern like signup)
      const isDev = window.location.hostname === 'localhost';

      // Use account-specific callback URL like signup does
      const redirectUrl = isDev
        ? `http://localhost:${window.location.port}/auth/callback?account_type=${accountType}&flow=signin`
        : `${window.location.origin}/auth/callback?account_type=${accountType}&flow=signin`;

      console.log(`🔄 ${accountType.toUpperCase()} OAuth signin redirect URL:`, redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Google signin error:', error);
        toast({
          title: "Sign in failed",
          description: "There was an error signing in with Google. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Google signin error:', error);
      toast({
        title: "Sign in failed",
        description: "There was an error signing in with Google. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleUserRedirect = async (user: any) => {
    try {
      console.log(`🔍 ${accountType.toUpperCase()} SIGNIN: Processing user redirect:`, {
        userId: user.id,
        email: user.email,
        accountType
      });

      // For account-specific signin, we know the account type
      // Skip complex detection and verify the user has a profile
      let profileExists = false;

      if (accountType === 'buyer') {
        const { data } = await supabase
          .from('user_buyers')
          .select('id')
          .eq('email', user.email)
          .single();
        profileExists = !!data;
      } else if (accountType === 'creator') {
        const { data } = await supabase
          .from('user_creators')
          .select('id')
          .eq('email', user.email)
          .single();
        profileExists = !!data;
      }

      console.log(`✅ ${accountType.toUpperCase()} SIGNIN: Profile check:`, { profileExists });

      if (profileExists) {
        // User has a profile, redirect to appropriate dashboard
        const displayInfo = getAccountTypeDisplayInfo(accountType);
        console.log(`✅ ${accountType.toUpperCase()} SIGNIN: Redirecting to dashboard:`, displayInfo.dashboardPath);
        navigate(displayInfo.dashboardPath);
      } else {
        // Handle missing profile
        if (accountType === 'buyer') {
          // For buyers, create a profile using atomic creation utility
          console.log('📝 BUYER SIGNIN: Creating buyer profile with atomic utility');

          const profileResult = await createBuyerProfileAtomic({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || '',
            buyer_company: user.user_metadata?.buyer_company || '',
            buyer_role: user.user_metadata?.buyer_role || '',
            linkedin_url: user.user_metadata?.linkedin_url || null,
            tier: 'basic'
          }, {
            enableSlack: true,
            debug: true
          });

          if (profileResult.success) {
            console.log('✅ BUYER SIGNIN: Profile created successfully, redirecting to dashboard');
            navigate('/buyers/home');
          } else {
            console.error('❌ BUYER SIGNIN: Failed to create profile:', profileResult.error);
            toast({
              title: "Profile creation failed",
              description: "There was an error setting up your account. Please contact support.",
              variant: "destructive"
            });
          }
        } else {
          // For creators, redirect to signup completion
          console.log('📝 CREATOR SIGNIN: No profile found, redirecting to signup completion');
          navigate(`/signup/creator?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`);
        }
      }

    } catch (error) {
      console.error(`❌ ${accountType.toUpperCase()} SIGNIN: Error during user redirect:`, error);
      toast({
        title: "Sign in failed",
        description: "There was an error signing you in. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSigninError('');

    try {
      // Clear any cached account type info before signin
      clearAccountTypeCache();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        // Handle different error types appropriately
        if (error.message.includes('Invalid login credentials')) {
          setSigninError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setSigninError('Please check your email and click the verification link before signing in.');
          setUnverifiedEmail(formData.email);
          setShowEmailVerificationAlert(true);
        } else {
          setSigninError(error.message);
        }
        return;
      }

      if (data.user) {
        console.log(`✅ ${accountType.toUpperCase()} SIGNIN: Email signin successful for:`, data.user.email);

        // Prepare for Slack notification
        try {
          await notifyUserSignin({
            userEmail: data.user.email!,
            userId: data.user.id,
            authType: 'email',
            accountType: accountType
          });
        } catch (error) {
          console.error('Error preparing signin notification:', error);
        }

        await handleUserRedirect(data.user);
      }
    } catch (error) {
      console.error(`❌ ${accountType.toUpperCase()} SIGNIN: Error during email signin:`, error);
      setSigninError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unverifiedEmail,
      });

      if (error) {
        toast({
          title: "Resend failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Verification email sent",
          description: "Please check your email for the verification link.",
          duration: 5000
        });
        setShowEmailVerificationAlert(false);
      }
    } catch (error) {
      toast({
        title: "Resend failed",
        description: "There was an error sending the verification email.",
        variant: "destructive"
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const accountTypeDisplayName = accountType === 'buyer' ? 'Buyer' : 'Creator';
  const otherAccountType = accountType === 'buyer' ? 'creator' : 'buyer';
  const otherAccountTypeDisplayName = accountType === 'buyer' ? 'Creator' : 'Buyer';

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-xl border-0">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-midnight-ink mb-2">
              {accountTypeDisplayName} Sign In
            </h1>
            <p className="text-midnight-ink-600">
              Welcome back! Sign in to your {accountType} account.
            </p>
          </div>

          {/* Email Verification Alert */}
          {showEmailVerificationAlert && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-semibold text-amber-800 mb-2">Email Verification Required</h3>
              <p className="text-sm text-amber-700 mb-3">
                Please check your email ({unverifiedEmail}) and click the verification link before signing in.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                  size="sm"
                  variant="outline"
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  {isResendingVerification ? 'Sending...' : 'Resend verification email'}
                </Button>
                <Button
                  onClick={() => setShowEmailVerificationAlert(false)}
                  size="sm"
                  variant="ghost"
                  className="text-amber-700 hover:bg-amber-100"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {signinError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{signinError}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full mb-6 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm"
            size="lg"
          >
            {isGoogleLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-3"></div>
                Signing in...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </div>
            )}
          </Button>

          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Email Sign In Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-4">
            <Link
              to="/forgot-password"
              className="text-sm text-hanok-teal hover:text-hanok-teal/80"
            >
              Forgot your password?
            </Link>

            <div className="text-sm text-gray-600">
              Don't have a {accountType} account?{' '}
              <Link
                to={`/signup/${accountType}`}
                className="text-hanok-teal hover:text-hanok-teal/80 font-medium"
              >
                Sign up here
              </Link>
            </div>

            <div className="text-sm text-gray-600">
              Looking for {otherAccountTypeDisplayName} signin?{' '}
              <Link
                to={`/signin/${otherAccountType}`}
                className="text-hanok-teal hover:text-hanok-teal/80 font-medium"
              >
                {otherAccountTypeDisplayName} Sign In
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SigninForm;