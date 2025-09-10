import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { Card, CardContent } from '@kstorybridge/ui';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { notifyUserSignin } from '@/utils/slack';

const SigninPage = () => {
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
      
      // Show toast message
      toast({
        title: "Email Verification Required",
        description: `A verification email has been sent to ${emailParam}. Please check your inbox and click the verification link before signing in.`,
        duration: 8000
      });
    }
    
    // Check if coming from sign out
    if (signedOut) {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
        duration: 4000
      });
    }
    
    // Check if coming from password reset
    if (location.state?.message) {
      toast({
        title: "Success!",
        description: location.state.message,
        duration: 6000
      });
    }
  }, [toast, location]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    try {
      // Force localhost for development
      const isDev = window.location.hostname === 'localhost';
      const redirectUrl = isDev 
        ? `http://localhost:${window.location.port}/auth/callback`
        : `${window.location.origin}/auth/callback`;
      
      console.log('🔄 OAuth signin redirect URL:', redirectUrl);
      
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
          title: "Google Signin Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Unexpected error during Google signin:', error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const sendSigninNotification = async (user: any, signinMethod: 'email' | 'oauth') => {
    try {
      // Determine user type and company info
      const accountType = user.user_metadata?.account_type;
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      
      let userType: 'buyer' | 'creator' = 'buyer'; // default
      let company = user.user_metadata?.company;

      // Check if user is a creator
      if (accountType === 'ip_owner') {
        userType = 'creator';
        company = user.user_metadata?.pen_name || company; // Use pen name as company for creators
      } else if (accountType === 'buyer' || !accountType) {
        // For buyers, try to get company from user_buyers table
        const { data: buyerProfile } = await supabase
          .from('user_buyers')
          .select('company')
          .eq('email', user.email?.toLowerCase())
          .maybeSingle();
        
        if (buyerProfile?.company) {
          company = buyerProfile.company;
        }
      }

      // Send Slack notification (non-blocking)
      notifyUserSignin({
        fullName,
        email: user.email,
        userType,
        signinMethod,
        company
      }).catch(error => {
        console.error('Failed to send signin notification:', error);
        // Don't throw - notifications shouldn't block signin
      });
    } catch (error) {
      console.error('Error preparing signin notification:', error);
      // Don't throw - notifications shouldn't block signin
    }
  };

  const checkUserProfileAndRedirect = async (user: any) => {
    try {
      const accountType = user.user_metadata?.account_type;
      
      console.log('🔍 SIGNIN: Checking user:', {
        userId: user.id,
        email: user.email,
        accountType: accountType,
        metadata: user.user_metadata
      });
      
      // If no account type is set, check if user exists in buyer table
      if (!accountType) {
        const { data: buyerCheck } = await supabase
          .from('user_buyers')
          .select('tier')
          .eq('email', user.email?.toLowerCase())
          .maybeSingle();
        
        if (buyerCheck) {
          console.log('🔍 SIGNIN: User found in buyers table, treating as buyer');
          console.log('✅ SIGNIN: Buyer profile found, redirecting to dashboard');
          navigate('/buyers/titles');
          return;
        }
      }
      
      if (accountType === 'buyer' || !accountType) {
        // Try fetching by email first (most reliable), then by id
        const { data: profileByEmail } = await supabase
          .from('user_buyers')
          .select('tier, email, id')
          .eq('email', user.email?.toLowerCase())
          .maybeSingle();
        
        let profile = profileByEmail;
        
        // If not found by email, try by ID
        if (!profile) {
          const { data: profileById } = await supabase
            .from('user_buyers')
            .select('tier, email, id')
            .eq('id', user.id)
            .maybeSingle();
          
          profile = profileById;
        }
        
        console.log('🔍 SIGNIN: Buyer profile lookup:', {
          userId: user.id,
          userEmail: user.email,
          profile: profile,
          profileTier: profile?.tier
        });
        
        // If no profile exists, create one with basic tier (new default)
        if (!profile) {
          console.log('📝 SIGNIN: No buyer profile found, creating one with basic tier');
          const { data: newProfile, error: createError } = await supabase
            .from('user_buyers')
            .insert({
              id: user.id,
              email: user.email,
              tier: 'basic', // Default tier for new signups
              created_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating buyer profile:', createError);
            // If can't create profile, redirect to signin
            toast({
              title: "Profile Creation Error",
              description: "Unable to create your profile. Please try again.",
              variant: "destructive"
            });
            return;
          }
          
          console.log('✅ SIGNIN: Created buyer profile with basic tier, redirecting to dashboard');
          navigate('/buyers/titles');
          return;
        }
        
        // All buyers with profiles can access dashboard
        console.log('✅ SIGNIN: Buyer profile found (tier: ' + (profile.tier || 'basic') + '), redirecting to dashboard');
        navigate('/buyers/titles');
      } else if (accountType === 'ip_owner') {
        const { data: profile, error } = await supabase
          .from('user_ipowners')
          .select('id, email')
          .eq('email', user.email?.toLowerCase())
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching IP owner profile:', error);
          toast({
            title: "Profile Error",
            description: "Unable to load your creator profile. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        if (profile) {
          console.log('✅ SIGNIN: Creator profile found, redirecting to dashboard');
          navigate('/creators/home/');
        } else {
          console.log('⚠️ SIGNIN: No creator profile found');
          toast({
            title: "Profile Not Found",
            description: "Creator profile not found. Please complete your signup.",
            variant: "destructive"
          });
        }
      } else {
        // If no account type, default to buyer dashboard
        console.log('🔄 SIGNIN: No account type specified, defaulting to buyer');
        navigate('/buyers/titles');
      }
    } catch (error) {
      console.error('Error during signin process:', error);
      toast({
        title: "Sign In Error",
        description: "An error occurred during sign in. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSigninError(''); // Clear previous errors

    try {
      if (!formData.email || !formData.password) {
        const errorMsg = "Please fill in all fields";
        setSigninError(errorMsg);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      
      if (error) {
        console.error('Signin error:', error);
        
        // Provide user-friendly error messages
        let errorTitle = "Sign In Failed";
        let errorMessage = error.message;
        
        // Check for specific error types and provide better messages
        if (error.message?.includes('Invalid login credentials')) {
          errorTitle = "Invalid Credentials";
          errorMessage = "The email or password you entered is incorrect. Please try again.";
        } else if (error.message?.includes('Email not confirmed') || 
                   error.message?.includes('email_not_confirmed') ||
                   error.message?.includes('not confirmed')) {
          errorTitle = "Email Not Verified";
          errorMessage = "Please check your email and click the verification link before signing in.";
          setUnverifiedEmail(formData.email);
          setShowEmailVerificationAlert(true);
        } else if (error.message?.includes('Invalid email')) {
          errorTitle = "Invalid Email";
          errorMessage = "Please enter a valid email address.";
        } else if (error.message?.includes('User not found')) {
          errorTitle = "Account Not Found";
          errorMessage = "No account found with this email. Please sign up first.";
        }
        
        // Set error state for visual feedback
        setSigninError(errorMessage);
        
        // Always show the toast with error
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
          duration: 5000
        });
        
        setIsLoading(false);
        return;
      }
      
      if (data.user) {
        toast({
          title: "Success!",
          description: "You have been signed in successfully."
        });
        
        // Send signin notification (non-blocking)
        await sendSigninNotification(data.user, 'email');
        
        // Check user profile and redirect accordingly
        await checkUserProfileAndRedirect(data.user);
      }
    } catch (error) {
      console.error('Unexpected error during signin:', error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    
    setIsResendingVerification(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unverifiedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Verification Email Sent",
          description: "Please check your email for the verification link.",
          duration: 5000
        });
        setShowEmailVerificationAlert(false);
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-md mx-auto">
              {/* Header Section */}
              <div className="text-center mb-12">
                <h1 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
                  Welcome Back
                </h1>
                <p className="text-xl text-midnight-ink-600">
                  Sign in to your account to continue
                </p>
              </div>

              {/* Email Verification Alert */}
              {showEmailVerificationAlert && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-amber-800">
                        Email Verification Required
                      </h3>
                      <div className="mt-2 text-sm text-amber-700">
                        <p>Your email address <strong>{unverifiedEmail}</strong> hasn't been verified yet.</p>
                        <p className="mt-1">Please check your email and click the verification link to complete your account setup.</p>
                        <p className="mt-1 text-xs text-amber-600">Don't see the email? Check your spam folder or click "Resend" below.</p>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <Button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={isResendingVerification}
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1"
                        >
                          {isResendingVerification ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                              Sending...
                            </div>
                          ) : (
                            'Resend Verification Email'
                          )}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setShowEmailVerificationAlert(false)}
                          className="text-xs text-amber-800 hover:text-amber-900 font-medium underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sign In Form */}
              <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                <CardContent className="p-8">
              
              {/* Error Alert */}
              {signinError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {signinError}
                      </p>
                    </div>
                    <div className="ml-auto pl-3">
                      <button
                        type="button"
                        onClick={() => setSigninError('')}
                        className="inline-flex text-red-400 hover:text-red-500"
                      >
                        <span className="sr-only">Dismiss</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Google Sign In Button */}
              <div className="mb-6">
                <Button 
                  id="signin-google-btn"
                  type="button"
                  className="w-full h-12 text-base font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors rounded-md"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                      Signing in with Google...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with email</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-midnight-ink">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-midnight-ink">
                      Password
                    </Label>
                    <Link 
                      to="/forgot-password" 
                      className="text-sm font-medium text-hanok-teal hover:text-hanok-teal-600 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  id="signin-form-submit-btn"
                  type="submit" 
                  className="w-full h-12 text-base bg-hanok-teal hover:bg-hanok-teal-600 text-white font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="mt-8 pt-6 border-t border-midnight-ink-100">
                <p className="text-center text-midnight-ink-600">
                  Don't have an account?{' '}
                  <Link 
                    to="/signup/buyer" 
                    className="font-medium text-hanok-teal hover:text-hanok-teal-600 transition-colors"
                  >
                    Sign up for free
                  </Link>
                </p>
              </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <div className="mt-8 text-center">
                <p className="text-sm text-midnight-ink-500">
                  By signing in, you agree to our terms of service and privacy policy.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SigninPage;