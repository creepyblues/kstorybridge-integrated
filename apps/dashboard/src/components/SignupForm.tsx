import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { Card, CardContent } from '@kstorybridge/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kstorybridge/ui';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type AccountType = 'buyer' | 'creator';

interface SignupFormProps {
  accountType: AccountType;
}

interface BuyerFormData {
  email: string;
  password: string;
  fullName: string;
  buyerCompany: string;
  buyerRole: string;
  linkedinUrl: string;
}

interface CreatorFormData {
  email: string;
  password: string;
  fullName: string;
  penNameOrStudio: string;
  ipOwnerRole: string;
  ipOwnerCompany: string;
  websiteUrl: string;
}

const SignupForm: React.FC<SignupFormProps> = ({ accountType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [oAuthUserId, setOAuthUserId] = useState<string | null>(null);
  const [rejectionAlert, setRejectionAlert] = useState<{email: string; message: string} | null>(null);
  
  const [buyerFormData, setBuyerFormData] = useState<BuyerFormData>({
    email: '',
    password: '',
    fullName: '',
    buyerCompany: '',
    buyerRole: '',
    linkedinUrl: ''
  });

  const [creatorFormData, setCreatorFormData] = useState<CreatorFormData>({
    email: '',
    password: '',
    fullName: '',
    penNameOrStudio: '',
    ipOwnerRole: '',
    ipOwnerCompany: '',
    websiteUrl: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for signup rejection message and show alert
  useEffect(() => {
    const rejectionData = sessionStorage.getItem('signupRejection');
    if (rejectionData) {
      try {
        const rejection = JSON.parse(rejectionData);
        // Only show if it's recent (within last 30 seconds) to avoid stale messages
        if (Date.now() - rejection.timestamp < 30000) {
          setRejectionAlert({
            email: rejection.email,
            message: rejection.message
          });
          
          toast({
            title: "Google Signup Failed",
            description: `${rejection.message} (${rejection.email})`,
            variant: "destructive",
            duration: 8000 // Show for longer duration
          });
        }
        // Clear the rejection data
        sessionStorage.removeItem('signupRejection');
      } catch (error) {
        console.error('Error parsing signup rejection data:', error);
        sessionStorage.removeItem('signupRejection');
      }
    }
  }, [toast]);

  // Check if this is an OAuth user completing their profile
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isComplete = urlParams.get('complete') === 'true';
    const userId = urlParams.get('user_id');
    const email = urlParams.get('email');
    
    if (isComplete && userId && email) {
      setIsOAuthUser(true);
      setOAuthUserId(userId);
      
      // Pre-fill email field
      if (accountType === 'buyer') {
        setBuyerFormData(prev => ({ ...prev, email }));
      } else {
        setCreatorFormData(prev => ({ ...prev, email }));
      }
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      
      toast({
        title: "Complete Your Profile",
        description: "Please fill in the additional details to complete your signup.",
        duration: 5000
      });
    }
  }, [accountType, toast]);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    
    try {
      console.log('🔄 Starting Google OAuth signup for:', accountType);
      
      // Force localhost for development
      const isDev = window.location.hostname === 'localhost';
      const baseUrl = isDev 
        ? `http://localhost:8081` 
        : `${window.location.origin}`;
      const redirectUrl = `${baseUrl}/auth/callback`;
      
      console.log('🔄 OAuth signup redirect URL:', redirectUrl);
      
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
        console.error('Google signup error:', error);
        toast({
          title: "Google Signup Error", 
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Unexpected error during Google signup:', error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const validateBuyerForm = (data: BuyerFormData) => {
    // For OAuth users, password is not required
    if (isOAuthUser) {
      if (!data.email || !data.fullName || !data.buyerCompany || !data.buyerRole) {
        console.log('❌ OAuth buyer validation failed. Missing:', {
          email: !data.email,
          fullName: !data.fullName,
          buyerCompany: !data.buyerCompany,
          buyerRole: !data.buyerRole
        });
        return "Please fill in all required fields";
      }
    } else {
      if (!data.email || !data.password || !data.fullName || !data.buyerCompany || !data.buyerRole) {
        return "Please fill in all required fields";
      }
      if (data.password.length < 6) {
        return "Password must be at least 6 characters long";
      }
    }
    return null;
  };

  const validateCreatorForm = (data: CreatorFormData) => {
    // For OAuth users, password is not required
    if (isOAuthUser) {
      if (!data.email || !data.fullName || !data.penNameOrStudio) {
        console.log('❌ OAuth creator validation failed. Missing:', {
          email: !data.email,
          fullName: !data.fullName,
          penNameOrStudio: !data.penNameOrStudio
        });
        return "Please fill in all required fields";
      }
    } else {
      if (!data.email || !data.password || !data.fullName || !data.penNameOrStudio) {
        return "Please fill in all required fields";
      }
      if (data.password.length < 6) {
        return "Password must be at least 6 characters long";
      }
    }
    return null;
  };

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateBuyerForm(buyerFormData);
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let authResult;
      
      // Handle OAuth completion vs new signup
      if (isOAuthUser && oAuthUserId) {
        // OAuth user completing profile - get existing auth session
        console.log('🔄 OAuth completion: Getting session for user:', oAuthUserId);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ OAuth session error:', sessionError);
          throw new Error(`OAuth session error: ${sessionError.message}`);
        }
        
        if (!session?.user) {
          console.error('❌ OAuth session not found or invalid');
          toast({
            title: "Session Expired",
            description: "Your login session has expired. Please sign in again.",
            variant: "destructive"
          });
          navigate('/signin');
          return;
        }
        
        console.log('✅ OAuth session found for user:', session.user.email);
        authResult = { data: { user: session.user }, error: null };
      } else {
        // Regular email signup
        authResult = await supabase.auth.signUp({
          email: buyerFormData.email,
          password: buyerFormData.password,
          options: {
            data: {
              full_name: buyerFormData.fullName,
              account_type: 'buyer',
              buyer_company: buyerFormData.buyerCompany,
              buyer_role: buyerFormData.buyerRole,
              linkedin_url: buyerFormData.linkedinUrl || null
            }
          }
        });
      }

      const { data, error } = authResult;
      
      if (error) {
        console.error('Buyer signup error:', error);
        let errorMessage = error.message;
        
        if (error.message?.includes('User already registered')) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        } else if (error.message?.includes('Invalid email')) {
          errorMessage = "Please enter a valid email address.";
        }
        
        toast({
          title: "Signup Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        // Create buyer profile
        console.log('👤 Creating buyer profile for user:', data.user.email);
        const profileData = {
          id: data.user.id,
          email: buyerFormData.email,
          full_name: buyerFormData.fullName,
          buyer_company: buyerFormData.buyerCompany,
          buyer_role: buyerFormData.buyerRole,
          linkedin_url: buyerFormData.linkedinUrl || null,
          tier: 'basic' // Default tier for new signups
        };
        
        console.log('📝 Profile data to insert:', profileData);

        const { error: profileError } = await supabase
          .from('user_buyers')
          .insert(profileData);

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          toast({
            title: "Profile Creation Failed",
            description: `Profile creation failed: ${profileError.message}. Please try again.`,
            variant: "destructive"
          });
          return;
        }
        
        console.log('✅ Buyer profile created successfully');

        // Success handling
        if (isOAuthUser) {
          toast({
            title: "Profile Completed!",
            description: "Your buyer profile has been created successfully."
          });
          navigate('/buyers/titles');
        } else {
          toast({
            title: "Account Created Successfully!",
            description: "Please check your email for verification before signing in."
          });
          navigate(`/signin?from=signup&email=${encodeURIComponent(buyerFormData.email)}`);
        }
      }
    } catch (error) {
      console.error('Unexpected error during buyer signup:', error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateCreatorForm(creatorFormData);
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let authResult;
      
      // Handle OAuth completion vs new signup
      if (isOAuthUser && oAuthUserId) {
        // OAuth user completing profile - get existing auth session
        console.log('🔄 OAuth completion: Getting session for creator user:', oAuthUserId);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ OAuth session error:', sessionError);
          throw new Error(`OAuth session error: ${sessionError.message}`);
        }
        
        if (!session?.user) {
          console.error('❌ OAuth session not found or invalid');
          toast({
            title: "Session Expired",
            description: "Your login session has expired. Please sign in again.",
            variant: "destructive"
          });
          navigate('/signin');
          return;
        }
        
        console.log('✅ OAuth session found for creator user:', session.user.email);
        authResult = { data: { user: session.user }, error: null };
      } else {
        // Regular email signup
        authResult = await supabase.auth.signUp({
          email: creatorFormData.email,
          password: creatorFormData.password,
          options: {
            data: {
              full_name: creatorFormData.fullName,
              account_type: 'ip_owner',
              pen_name: creatorFormData.penNameOrStudio,
              ip_owner_role: creatorFormData.ipOwnerRole,
              ip_owner_company: creatorFormData.ipOwnerCompany,
              website_url: creatorFormData.websiteUrl || null
            }
          }
        });
      }

      const { data, error } = authResult;
      
      if (error) {
        console.error('Creator signup error:', error);
        let errorMessage = error.message;
        
        if (error.message?.includes('User already registered')) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        } else if (error.message?.includes('Invalid email')) {
          errorMessage = "Please enter a valid email address.";
        }
        
        toast({
          title: "Signup Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        // Create creator profile
        console.log('👤 Creating creator profile for user:', data.user.email);
        const profileData = {
          id: data.user.id,
          email: creatorFormData.email,
          full_name: creatorFormData.fullName,
          pen_name: creatorFormData.penNameOrStudio,
          ip_owner_role: creatorFormData.ipOwnerRole || null,
          ip_owner_company: creatorFormData.ipOwnerCompany || null,
          website_url: creatorFormData.websiteUrl || null,
          invitation_status: 'invited' // Default status for creators
        };
        
        console.log('📝 Creator profile data to insert:', profileData);

        const { error: profileError } = await supabase
          .from('user_ipowners')
          .insert(profileData);

        if (profileError) {
          console.error('❌ Creator profile creation error:', profileError);
          toast({
            title: "Profile Creation Failed",
            description: `Profile creation failed: ${profileError.message}. Please try again.`,
            variant: "destructive"
          });
          return;
        }
        
        console.log('✅ Creator profile created successfully');

        // Success handling
        if (isOAuthUser) {
          toast({
            title: "Profile Completed!",
            description: "Your creator profile has been created successfully."
          });
          navigate('/creators/titles');
        } else {
          toast({
            title: "Account Created Successfully!",
            description: "Please check your email for verification before signing in."
          });
          navigate(`/signin?from=signup&email=${encodeURIComponent(creatorFormData.email)}`);
        }
      }
    } catch (error) {
      console.error('Unexpected error during creator signup:', error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBuyerFormData = (field: keyof BuyerFormData, value: string) => {
    setBuyerFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCreatorFormData = (field: keyof CreatorFormData, value: string) => {
    setCreatorFormData(prev => ({ ...prev, [field]: value }));
  };

  const formData = accountType === 'buyer' ? buyerFormData : creatorFormData;
  const updateFormData = accountType === 'buyer' ? updateBuyerFormData : updateCreatorFormData;
  const handleSubmit = accountType === 'buyer' ? handleBuyerSubmit : handleCreatorSubmit;

  return (
    <div>
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
          {accountType === 'buyer' ? 'Join as a Buyer' : 'Join as a Creator'}
        </h1>
        <p className="text-xl text-midnight-ink-600">
          {accountType === 'buyer' 
            ? 'Get access to premium Korean content for your business'
            : 'Share your creative work with global buyers'
          }
        </p>
      </div>

      {/* Rejection Alert */}
      {rejectionAlert && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Google Signup Failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p><strong>{rejectionAlert.email}</strong></p>
                <p>{rejectionAlert.message}</p>
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={() => setRejectionAlert(null)}
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

      {/* Sign Up Form */}
      <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
        <CardContent className="p-8">
          
          {/* Google Sign Up Button - only show for new signups, not OAuth completion */}
          {!isOAuthUser && (
            <div className="mb-6">
              <Button 
                type="button"
                className="w-full h-12 text-base font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors rounded-md"
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                    Signing up with Google...
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
            {/* Common Fields */}
            {!isOAuthUser && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-midnight-ink">
                  Email address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email' as any, e.target.value)}
                  className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                  placeholder="Enter your email"
                  required
                  disabled={isOAuthUser}
                />
              </div>
            )}

            {!isOAuthUser && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-midnight-ink">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password' as any, e.target.value)}
                  className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                  placeholder="Create a password (min. 6 characters)"
                  required
                  minLength={6}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-midnight-ink">
                Full Name *
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => updateFormData('fullName' as any, e.target.value)}
                className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Buyer-specific fields */}
            {accountType === 'buyer' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="buyerCompany" className="text-sm font-medium text-midnight-ink">
                    Company *
                  </Label>
                  <Input
                    id="buyerCompany"
                    type="text"
                    value={buyerFormData.buyerCompany}
                    onChange={(e) => updateBuyerFormData('buyerCompany', e.target.value)}
                    className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                    placeholder="Enter your company name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buyerRole" className="text-sm font-medium text-midnight-ink">
                    Role *
                  </Label>
                  <Select
                    value={buyerFormData.buyerRole}
                    onValueChange={(value) => updateBuyerFormData('buyerRole', value)}
                  >
                    <SelectTrigger className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Content Acquisitions">Content Acquisitions</SelectItem>
                      <SelectItem value="Producer">Producer</SelectItem>
                      <SelectItem value="Director of Development">Director of Development</SelectItem>
                      <SelectItem value="Creative Executive">Creative Executive</SelectItem>
                      <SelectItem value="Development Executive">Development Executive</SelectItem>
                      <SelectItem value="Content Strategist">Content Strategist</SelectItem>
                      <SelectItem value="Media Buyer">Media Buyer</SelectItem>
                      <SelectItem value="Business Development">Business Development</SelectItem>
                      <SelectItem value="CEO/Founder">CEO/Founder</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl" className="text-sm font-medium text-midnight-ink">
                    LinkedIn Profile
                  </Label>
                  <Input
                    id="linkedinUrl"
                    type="url"
                    value={buyerFormData.linkedinUrl}
                    onChange={(e) => updateBuyerFormData('linkedinUrl', e.target.value)}
                    className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                    placeholder="https://linkedin.com/in/yourprofile (optional)"
                  />
                </div>
              </>
            )}

            {/* Creator-specific fields */}
            {accountType === 'creator' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="penNameOrStudio" className="text-sm font-medium text-midnight-ink">
                    Pen Name / Studio Name *
                  </Label>
                  <Input
                    id="penNameOrStudio"
                    type="text"
                    value={creatorFormData.penNameOrStudio}
                    onChange={(e) => updateCreatorFormData('penNameOrStudio', e.target.value)}
                    className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                    placeholder="Enter your pen name or studio name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipOwnerRole" className="text-sm font-medium text-midnight-ink">
                    Role
                  </Label>
                  <Input
                    id="ipOwnerRole"
                    type="text"
                    value={creatorFormData.ipOwnerRole}
                    onChange={(e) => updateCreatorFormData('ipOwnerRole', e.target.value)}
                    className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                    placeholder="e.g., Author, Artist, Director (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipOwnerCompany" className="text-sm font-medium text-midnight-ink">
                    Company / Studio
                  </Label>
                  <Input
                    id="ipOwnerCompany"
                    type="text"
                    value={creatorFormData.ipOwnerCompany}
                    onChange={(e) => updateCreatorFormData('ipOwnerCompany', e.target.value)}
                    className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                    placeholder="Enter your company or studio (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl" className="text-sm font-medium text-midnight-ink">
                    Website / Portfolio
                  </Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={creatorFormData.websiteUrl}
                    onChange={(e) => updateCreatorFormData('websiteUrl', e.target.value)}
                    className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                    placeholder="https://yourwebsite.com (optional)"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-base bg-hanok-teal hover:bg-hanok-teal-600 text-white font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isOAuthUser ? 'Completing Profile...' : 'Creating Account...'}
                </div>
              ) : (
                isOAuthUser ? 'Complete Profile' : `Sign Up as ${accountType === 'buyer' ? 'Buyer' : 'Creator'}`
              )}
            </Button>
          </form>

          {/* Divider */}
          {!isOAuthUser && (
            <div className="mt-8 pt-6 border-t border-midnight-ink-100">
              <p className="text-center text-midnight-ink-600">
                Already have an account?{' '}
                <Link 
                  to="/signin" 
                  className="font-medium text-hanok-teal hover:text-hanok-teal-600 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="mt-8 text-center">
        <p className="text-sm text-midnight-ink-500">
          By signing up, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
};

export default SignupForm;