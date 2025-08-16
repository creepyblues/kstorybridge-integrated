
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { Card, CardContent } from '@kstorybridge/ui';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { getDashboardUrl } from '../config/urls';
import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';

const SigninPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const redirectToDashboard = async () => {
    console.log('🔄 SIGNIN: Redirecting to dashboard');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const dashboardUrl = getDashboardUrl();
      const sessionParams = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token || '',
        expires_at: session.expires_at?.toString() || '',
        token_type: session.token_type || 'bearer'
      });
      const finalUrl = `${dashboardUrl}?${sessionParams.toString()}`;
      console.log('🔄 SIGNIN: Redirecting to dashboard:', finalUrl.substring(0, 100) + '...');
      
      // Direct redirect to dashboard
      window.location.href = finalUrl;
    } else {
      console.error('❌ SIGNIN: No session found for authenticated user');
      toast({
        title: "Session Error",
        description: "Unable to redirect to dashboard. Please try signing in again.",
        variant: "destructive"
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    try {
      // Force localhost for development
      const isDev = window.location.hostname === 'localhost';
      const redirectUrl = isDev 
        ? `http://localhost:5173/auth/callback`
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

  const checkInvitationStatusAndRedirect = async (user: any) => {
    try {
      const accountType = user.user_metadata?.account_type;
      
      if (accountType === 'buyer') {
        const { data: profile, error } = await supabase
          .from('user_buyers')
          .select('tier')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching buyer profile:', error);
          // Default to invited dashboard on error
          navigate('/invited');
          return;
        }
        
        if (profile?.tier && profile.tier !== 'invited') {
          console.log('✅ SIGNIN: Buyer accepted (tier: ' + profile.tier + '), redirecting directly to dashboard');
          await redirectToDashboard();
        } else {
          navigate('/invited');
        }
      } else if (accountType === 'ip_owner') {
        const { data: profile, error } = await supabase
          .from('user_ipowners')
          .select('invitation_status')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching IP owner profile:', error);
          // Default to creator invited page on error
          navigate('/creator/invited');
          return;
        }
        
        if (profile?.invitation_status === 'accepted') {
          console.log('✅ SIGNIN: Creator accepted, redirecting directly to dashboard');
          await redirectToDashboard();
        } else {
          navigate('/creator/invited');
        }
      } else {
        // If no account type, default to invited dashboard
        navigate('/invited');
      }
    } catch (error) {
      console.error('Error checking invitation status:', error);
      navigate('/invited');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.email || !formData.password) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      
      if (error) {
        console.error('Signin error:', error);
        toast({
          title: "Signin Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      if (data.user) {
        toast({
          title: "Success!",
          description: "You have been signed in successfully."
        });
        
        // Check invitation status and redirect accordingly
        await checkInvitationStatusAndRedirect(data.user);
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

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <PageHeader />
      
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

              {/* Sign In Form */}
              <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                <CardContent className="p-8">
              {/* Google Sign In Button */}
              {true && (
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
              )}

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
                  <Label htmlFor="password" className="text-sm font-medium text-midnight-ink">
                    Password
                  </Label>
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
      
      <Footer />
    </div>
  );
};

export default SigninPage;
