import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { Card, CardContent } from '@kstorybridge/ui';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { getDashboardUrl } from '../config/urls';
import UniversalHeader from '../components/UniversalHeader';
import Footer from '../components/Footer';
import { CheckCircle, Eye, EyeOff } from 'lucide-react';

const InvitationAcceptPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [isValidInvitation, setIsValidInvitation] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkInvitation = async () => {
      try {
        // Check URL parameters for invitation tokens first
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const type = urlParams.get('type') || hashParams.get('type');
        const inviteToken = urlParams.get('invite_token') || hashParams.get('invite_token');
        const invitationToken = urlParams.get('invitation_token') || hashParams.get('invitation_token');
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        
        console.log('🔍 INVITATION ACCEPT: Checking invitation parameters');
        console.log('🔍 INVITATION ACCEPT: Type:', type);
        console.log('🔍 INVITATION ACCEPT: Access token:', accessToken ? 'present' : 'not present');
        console.log('🔍 INVITATION ACCEPT: Refresh token:', refreshToken ? 'present' : 'not present');
        
        // If we have access tokens in the URL, set the session manually
        if (accessToken && refreshToken) {
          console.log('🔄 INVITATION ACCEPT: Setting session from URL tokens');
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (setSessionError) {
            console.error('Error setting session:', setSessionError);
          }
        }
        
        // Check if we have a valid session from the invitation link
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          toast({
            title: "Invalid Invitation",
            description: "The invitation link is invalid or has expired. Please contact support.",
            variant: "destructive"
          });
          navigate('/signin');
          return;
        }

        if (session?.user) {
          setEmail(session.user.email || '');
          setIsValidInvitation(true);
          
          // Check if user already has a password (not an invitation)
          if (!session.user.user_metadata?.invitation_sent && session.user.email_confirmed_at) {
            // User already has an account, redirect to signin
            toast({
              title: "Account Already Active",
              description: "Your account is already set up. Please sign in normally.",
            });
            navigate('/signin');
            return;
          }
        } else {
          // No session, invalid invitation
          toast({
            title: "Invalid Invitation",
            description: "The invitation link is invalid or has expired. Please contact support.",
            variant: "destructive"
          });
          navigate('/signin');
        }
      } catch (error) {
        console.error('Error checking invitation:', error);
        navigate('/signin');
      }
    };

    checkInvitation();
  }, [toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate passwords
      if (!formData.password || !formData.confirmPassword) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 6 characters long",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Passwords Don't Match",
          description: "Please make sure both passwords are identical",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (updateError) {
        console.error('Error updating password:', updateError);
        toast({
          title: "Password Update Failed",
          description: updateError.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Get the updated session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Create user profile if it doesn't exist
        await createUserProfile(session.user);
        
        toast({
          title: "Password Set Successfully!",
          description: "Now let's complete your profile to get you started.",
          duration: 5000
        });

        // Redirect to profile completion page
        setTimeout(() => {
          navigate('/profile/complete');
        }, 2000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createUserProfile = async (user: any) => {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('user_buyers')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (existingProfile) {
        console.log('Profile already exists for user');
        return;
      }

      // Create a basic buyer profile for invited users
      const { error } = await supabase
        .from('user_buyers')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          tier: 'basic', // Default tier for invited users
          created_at: new Date().toISOString()
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error creating user profile:', error);
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  const redirectToDashboard = async (session: any) => {
    const dashboardUrl = getDashboardUrl();
    const sessionParams = new URLSearchParams({
      access_token: session.access_token,
      refresh_token: session.refresh_token || '',
      expires_at: session.expires_at?.toString() || '',
      token_type: session.token_type || 'bearer'
    });
    const finalUrl = `${dashboardUrl}?${sessionParams.toString()}`;
    window.location.href = finalUrl;
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isValidInvitation) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal mx-auto mb-4"></div>
          <p className="text-lg text-midnight-ink">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <UniversalHeader />
      
      <main className="flex-1">
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-md mx-auto">
              {/* Header Section */}
              <div className="text-center mb-12">
                <div className="flex justify-center mb-6">
                  <CheckCircle className="w-16 h-16 text-hanok-teal" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
                  Complete Your Setup
                </h1>
                <p className="text-xl text-midnight-ink-600">
                  Welcome! Please set a password to activate your account.
                </p>
                {email && (
                  <p className="text-sm text-midnight-ink-500 mt-4 bg-porcelain-blue-50 px-4 py-2 rounded-lg">
                    Setting up account for: <strong>{email}</strong>
                  </p>
                )}
              </div>

              {/* Password Setup Form */}
              <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-midnight-ink">
                        Create Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => updateFormData('password', e.target.value)}
                          className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg pr-10"
                          placeholder="Enter your password"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-midnight-ink-500">
                        Password must be at least 6 characters long
                      </p>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-midnight-ink">
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                          className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg pr-10"
                          placeholder="Confirm your password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base bg-hanok-teal hover:bg-hanok-teal-600 text-white font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Setting up account...
                        </div>
                      ) : (
                        'Complete Setup'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <div className="mt-8 text-center">
                <p className="text-sm text-midnight-ink-500">
                  Once you complete this setup, you'll be able to access the full platform.
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

export default InvitationAcceptPage;