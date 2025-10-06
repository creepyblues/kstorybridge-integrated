import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { Card, CardContent } from '@kstorybridge/ui';
import { useToast } from '@/hooks/use-toast';
import { trackAuthAction, trackFormSubmission, trackUserJourneyStep } from '@/utils/analytics';
import { supabase, performSupabaseHealthCheck } from '@/integrations/supabase/client';
import { performSessionHealthCheck, getCurrentSession, recoverCorruptedSession } from '@/utils/sessionManager';
import { getAccountType, getAccountTypeDisplayInfo } from '@/hooks/useAccountType';
import { notifyUserSignin } from '@/utils/slack';
import { createBuyerProfileAtomic } from '@/utils/atomicProfileCreator';
import { trackSigninError, trackValidationError } from '@/services/authErrorTracking';

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
    const message = urlParams.get('message');

    // Check if coming from email verification
    if (verified) {
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified. You can now sign in to your account.",
        duration: 8000
      });
    }

    // Check if coming from OAuth completion redirect
    if (message === 'oauth_complete') {
      toast({
        title: "Almost There!",
        description: "Your Google account was created successfully. Please sign in below to complete your profile setup.",
        duration: 8000
      });

      // Pre-fill email if provided
      if (emailParam) {
        setFormData(prev => ({ ...prev, email: emailParam }));
      }
    }

    if (fromSignup && emailParam) {
      setUnverifiedEmail(emailParam);
      setFormData(prev => ({ ...prev, email: emailParam }));
      setShowEmailVerificationAlert(true);
    } else if (fromSignup && !emailParam) {
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

    // Track Google OAuth sign-in attempt
    trackAuthAction('sign_in', 'google', accountType);
    trackUserJourneyStep('authentication', 'google_signin_initiated', 1, false, accountType, {
      signin_method: 'google'
    });

    try {
      console.log(`🔐 ${accountType.toUpperCase()} OAuth signin initiated with Google`);

      // Store flow data in sessionStorage (as backup)
      sessionStorage.setItem('oauth_account_type', accountType);
      sessionStorage.setItem('oauth_flow', 'signin');

      // Encode account_type and flow in redirect URL for reliable persistence
      const callbackUrl = `${window.location.origin}/auth/callback?account_type=${accountType}&flow=signin`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl
        }
      });

      if (error) {
        console.error('Google signin error:', error);

        // Track OAuth signin error
        await trackSigninError(
          error,
          '',
          true,
          {
            stage: 'supabase_auth',
            accountType: accountType,
            oauthProvider: 'google'
          }
        );

        toast({
          title: "Sign in failed",
          description: "There was an error signing in with Google. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Google signin error:', error);

      // Track OAuth signin error
      await trackSigninError(
        error,
        '',
        true,
        {
          stage: 'supabase_auth',
          accountType: accountType,
          oauthProvider: 'google'
        }
      );

      toast({
        title: "Sign in failed",
        description: "There was an error signing in with Google. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleUserRedirect = async (user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) => {
    try {
      console.log(`🔍 ${accountType.toUpperCase()} SIGNIN: Processing user redirect:`, {
        userId: user.id,
        email: user.email,
        accountType
      });

      // For account-specific signin, we know the account type
      // Skip complex detection and verify the user has a profile
      let profileExists = false;

      const userId = user.id;
      console.log(`🔍 ${accountType.toUpperCase()} SIGNIN: Checking profile by user id:`, userId);

      if (accountType === 'buyer') {
        const { data } = await supabase
          .from('user_buyers')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        profileExists = !!data;
      } else if (accountType === 'creator') {
        const { data } = await supabase
          .from('user_creators')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
        profileExists = !!data;
      }

      console.log(`✅ ${accountType.toUpperCase()} SIGNIN: Profile check:`, { profileExists });

      if (profileExists) {
        // User has a profile, redirect to appropriate dashboard
        const displayInfo = getAccountTypeDisplayInfo(accountType);
        console.log(`✅ ${accountType.toUpperCase()} SIGNIN: Redirecting to dashboard:`, displayInfo.dashboardPath);
        navigate(displayInfo.dashboardPath);
      } else {
        // Handle missing profile - user needs to signup first
        console.log(`❌ ${accountType.toUpperCase()} SIGNIN: No profile found - user must signup first`);

        toast({
          title: "Account Not Found",
          description: "Your account doesn't exist. Please sign up first.",
          variant: "destructive"
        });

        // Redirect to signup page after brief delay
        setTimeout(() => {
          navigate(`/signup/${accountType}`);
        }, 2000);
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

    // Validate required fields
    if (!formData.email || !formData.password) {
      const validationError = !formData.email ? 'Email is required' : 'Password is required';

      // Track validation error
      await trackValidationError(
        validationError,
        formData.email || '',
        accountType,
        {
          failureType: 'signin_email'
        }
      );

      setSigninError(validationError);
      setIsLoading(false);
      return;
    }

    // Track form submission attempt
    trackFormSubmission('signin', 'signin_page', accountType, {
      signin_method: 'email',
      account_type: accountType
    });

    try {
      // No need to clear cache with metadata-first approach

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        // Track signin error
        await trackSigninError(
          error,
          formData.email,
          false,
          {
            stage: 'supabase_auth',
            accountType: accountType,
            errorCode: (error as any).code || undefined
          }
        );

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

        // Track successful authentication
        trackAuthAction('sign_in', 'email', accountType);
        trackUserJourneyStep('authentication', 'signin_successful', 2, true, accountType, {
          signin_method: 'email',
          user_id: data.user.id
        });

        // Send Slack notification with correct parameters
        try {
          await notifyUserSignin({
            fullName: data.user.user_metadata?.full_name || data.user.email!.split('@')[0],
            email: data.user.email!,
            userType: accountType as 'buyer' | 'creator',
            signinMethod: 'email',
            company: data.user.user_metadata?.buyer_company
          });
        } catch (error) {
          console.error('Error sending signin notification:', error);
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
              <h3 className="font-semibold text-amber-800 mb-2">Verify Your Email</h3>
              <p className="text-sm text-amber-700 mb-3">
                {unverifiedEmail
                  ? `We've sent a verification link to ${unverifiedEmail}.`
                  : "We've sent a verification link to your email."}
              </p>
              {unverifiedEmail && (
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
              )}
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
            className="w-full h-14 mb-6 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm text-base"
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
                  <path fill="#6B7280" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </div>
            )}
          </Button>

          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
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
              className="w-full h-14 bg-hanok-teal hover:bg-hanok-teal/90 text-white text-base"
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
