import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { Card, CardContent } from '@kstorybridge/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kstorybridge/ui';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { notifyBuyerSignup, notifyCreatorSignup } from '@/utils/slack';
import { sendWelcomeEmail } from '@/services/emailService';
import { createBuyerProfileAtomic, createCreatorProfileAtomic } from '@/utils/atomicProfileCreator';

type AccountType = 'buyer' | 'creator';

interface SignupFormProps {
  accountType: AccountType;
}

interface BuyerFormData {
  email: string;
  password: string;
  full_name: string;
  buyer_company: string;
  buyer_role: string;
  linkedin_url: string;
  tier?: 'basic' | 'invited' | 'pro' | 'suite';
}

interface CreatorFormData {
  email: string;
  password: string;
  full_name: string;
  pen_name: string;
  ip_owner_role: string;
  ip_owner_company: string;
  website_url: string;
  invitation_status?: string;
}


const SignupForm: React.FC<SignupFormProps> = ({ accountType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [oAuthUserId, setOAuthUserId] = useState<string | null>(null);
  const [rejectionAlert, setRejectionAlert] = useState<{email: string; message: string} | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [buyerFormData, setBuyerFormData] = useState<BuyerFormData>({
    email: '',
    password: '',
    full_name: '',
    buyer_company: '',
    buyer_role: '',
    linkedin_url: '',
    tier: 'basic'
  });

  const [creatorFormData, setCreatorFormData] = useState<CreatorFormData>({
    email: '',
    password: '',
    full_name: '',
    pen_name: '',
    ip_owner_role: '',
    ip_owner_company: '',
    website_url: '',
    invitation_status: 'invited'
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user from auth context

  // Password validation function
  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    
    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    
    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(password)) {
      return "Password must contain at least one special character";
    }
    
    return null;
  };

  // Handle password change with validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    if (accountType === 'buyer') {
      setBuyerFormData(prev => ({ ...prev, password: newPassword }));
    } else {
      setCreatorFormData(prev => ({ ...prev, password: newPassword }));
    }
    
    // Clear error when user starts typing
    if (passwordError && newPassword.length > 0) {
      const error = validatePassword(newPassword);
      setPasswordError(error);
    }
  };

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

  // Separate effect for when user data becomes available (OAuth flow)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isComplete = urlParams.get('complete') === 'true';

    // Only run this if we're in OAuth completion mode and have user data
    if (isComplete && user) {
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';

      console.log('📋 SIGNUP FORM: User data available, pre-filling OAuth user data:', {
        email: user.email,
        fullName,
        userId: user.id,
        metadata: user.user_metadata
      });

      // Pre-fill form fields with OAuth data
      if (accountType === 'buyer') {
        setBuyerFormData(prev => ({
          ...prev,
          email: user.email || '',
          full_name: fullName
        }));
      } else {
        setCreatorFormData(prev => ({
          ...prev,
          email: user.email || '',
          full_name: fullName
        }));
      }
    }
  }, [user, accountType]); // Run when user data becomes available

  // Check if this is an OAuth user completing their profile
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isComplete = urlParams.get('complete') === 'true';
    const userId = urlParams.get('user_id');
    const email = urlParams.get('email');
    
    if (isComplete && userId && email) {
      setIsOAuthUser(true);
      setOAuthUserId(userId);
      
      // Set flag to prevent ProtectedRoute redirects during OAuth completion
      sessionStorage.setItem('oauth_completion_pending', 'true');
      
      // Load OAuth user data from auth context (bypass hanging getSession)
      const loadOAuthUserData = () => {
        try {
          if (user) {
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';

            console.log('📋 SIGNUP FORM: Pre-filling OAuth user data from auth context:', {
              email: user.email,
              fullName,
              userId: user.id,
              metadata: user.user_metadata
            });

            // Pre-fill form fields with OAuth data
            if (accountType === 'buyer') {
              setBuyerFormData(prev => ({
                ...prev,
                email: user.email || email,
                full_name: fullName
              }));
            } else {
              setCreatorFormData(prev => ({
                ...prev,
                email: user.email || email,
                full_name: fullName
              }));
            }
          } else {
            console.warn('⚠️ SIGNUP FORM: No user in auth context, using fallback email');
            // Fallback to just email
            if (accountType === 'buyer') {
              setBuyerFormData(prev => ({ ...prev, email }));
            } else {
              setCreatorFormData(prev => ({ ...prev, email }));
            }
          }
        } catch (error) {
          console.error('❌ SIGNUP FORM: Error loading OAuth user data:', error);
          // Fallback to just email
          if (accountType === 'buyer') {
            setBuyerFormData(prev => ({ ...prev, email }));
          } else {
            setCreatorFormData(prev => ({ ...prev, email }));
          }
        }
      };
      
      loadOAuthUserData();
      
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      
      toast({
        title: "Complete Your Profile",
        description: "We've pre-filled some information from your Google account. Please review and complete the remaining details.",
        duration: 6000
      });
    }
  }, [accountType, toast]);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    
    try {
      console.log('🔄 Starting Google OAuth signup for:', accountType);
      
      // Use environment variable for OAuth redirect URL in development
      const isDev = window.location.hostname === 'localhost';
      const forceRedirectUrl = import.meta.env.VITE_OAUTH_REDIRECT_URL;

      let redirectUrl: string;
      if (isDev && forceRedirectUrl) {
        // Use forced redirect URL for development
        redirectUrl = `${forceRedirectUrl}?account_type=${accountType}&flow=signup`;
      } else {
        // Use standard redirect URL construction
        const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || window.location.origin;
        const baseUrl = isDev ? dashboardUrl : window.location.origin;
        redirectUrl = `${baseUrl}/auth/callback?account_type=${accountType}&flow=signup`;
      }

      console.log('🔄 OAuth signup redirect URL (with account_type):', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Store account_type in localStorage as a fallback
          scopes: 'email profile'
        }
      });
      
      // Store account type in sessionStorage as fallback
      // This will be available when the user returns from OAuth
      if (!error) {
        sessionStorage.setItem('oauth_account_type', accountType);
        console.log('🔄 Stored account type in sessionStorage:', accountType);
      }
      
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
    console.log('🔍 VALIDATION: Starting buyer form validation');
    console.log('🔍 VALIDATION: Input data:', data);
    console.log('🔍 VALIDATION: isOAuthUser:', isOAuthUser);

    // Clear previous errors
    setRoleError(null);

    // For OAuth users, password is not required
    if (isOAuthUser) {
      console.log('🔍 VALIDATION: OAuth user - checking required fields');
      const missingFields = {
        email: !data.email,
        full_name: !data.full_name,
        buyer_company: !data.buyer_company,
        buyer_role: !data.buyer_role
      };

      console.log('🔍 VALIDATION: Field check results:', missingFields);

      if (!data.email || !data.full_name || !data.buyer_company || !data.buyer_role) {
        console.log('❌ OAuth buyer validation failed. Missing:', missingFields);
        console.log('❌ Current form data:', data);

        // Set specific error for role field
        if (!data.buyer_role) {
          console.log('❌ VALIDATION: Missing role, setting role error');
          setRoleError("Please select your role");
        }

        return "Please fill in all required fields";
      }
    } else {
      if (!data.email || !data.password || !data.full_name || !data.buyer_company || !data.buyer_role) {
        // Set specific error for role field
        if (!data.buyer_role) {
          setRoleError("Please select your role");
        }
        return "Please fill in all required fields";
      }
      // Validate password complexity
      const passwordValidationError = validatePassword(data.password);
      if (passwordValidationError) {
        setPasswordError(passwordValidationError);
        return passwordValidationError;
      }
    }
    console.log('✅ Buyer form validation passed:', data);
    return null;
  };

  const validateCreatorForm = (data: CreatorFormData) => {
    // For OAuth users, password is not required
    if (isOAuthUser) {
      if (!data.email || !data.full_name || !data.pen_name) {
        console.log('❌ OAuth creator validation failed. Missing:', {
          email: !data.email,
          full_name: !data.full_name,
          pen_name: !data.pen_name
        });
        return "Please fill in all required fields";
      }
    } else {
      if (!data.email || !data.password || !data.full_name || !data.pen_name) {
        return "Please fill in all required fields";
      }
      // Validate password complexity
      const passwordValidationError = validatePassword(data.password);
      if (passwordValidationError) {
        setPasswordError(passwordValidationError);
        return passwordValidationError;
      }
    }
    return null;
  };

  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔄 FORM SUBMIT: Starting buyer form submission');
    console.log('📋 FORM SUBMIT: Current form data:', buyerFormData);
    console.log('📋 FORM SUBMIT: isOAuthUser:', isOAuthUser);
    console.log('📋 FORM SUBMIT: oAuthUserId:', oAuthUserId);

    const validationError = validateBuyerForm(buyerFormData);
    console.log('✅ FORM SUBMIT: Validation result:', validationError ? `FAILED: ${validationError}` : 'PASSED');

    if (validationError) {
      console.error('❌ FORM SUBMIT: Validation failed:', validationError);
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    console.log('🔄 FORM SUBMIT: Setting loading state');
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

        // Normalize Supabase metadata to ensure all buyer fields are set
        try {
          await supabase.auth.updateUser({
            data: {
              account_type: accountType,
              full_name: buyerFormData.full_name,
              buyer_company: buyerFormData.buyer_company,
              buyer_role: buyerFormData.buyer_role,
              linkedin_url: buyerFormData.linkedin_url || null,
              tier: buyerFormData.tier || 'basic',
              updated_via: 'signup_form_buyer_oauth'
            }
          });
          console.log('🔄 OAuth buyer signup: Complete metadata updated', {
            account_type: accountType,
            full_name: buyerFormData.full_name,
            buyer_company: buyerFormData.buyer_company,
            buyer_role: buyerFormData.buyer_role,
            tier: buyerFormData.tier || 'basic'
          });
        } catch (updateError) {
          console.error('⚠️ OAuth signup: Failed to update user metadata:', updateError);
        }

        authResult = { data: { user: session.user }, error: null };
      } else {
        // Regular email signup
        console.log('🔐 Attempting regular email signup...');
        console.log('📡 Testing Supabase connection first...');
        
        try {
          // Test basic connectivity
          const { data: testData, error: testError } = await supabase
            .from('user_buyers')
            .select('count')
            .limit(1);
          
          console.log('✅ Supabase connection test:', { testData, testError });
          
          console.log('📤 Starting auth signup with data:', {
            email: buyerFormData.email,
            hasPassword: !!buyerFormData.password,
            metadata: {
              full_name: buyerFormData.full_name,
              account_type: 'buyer',
              buyer_company: buyerFormData.buyer_company,
              buyer_role: buyerFormData.buyer_role
            }
          });
          
          // Auth signup with metadata (database trigger will create profile)
          console.log('🔐 Attempting auth signup with metadata...');
          authResult = await supabase.auth.signUp({
            email: buyerFormData.email,
            password: buyerFormData.password,
            options: {
              emailRedirectTo: `${window.location.hostname === 'localhost' ? (import.meta.env.VITE_DASHBOARD_URL || window.location.origin) : 'https://dashboard.kstorybridge.com'}/signin/buyer?verified=true`,
              data: {
                full_name: buyerFormData.full_name,
                account_type: 'buyer',
                buyer_company: buyerFormData.buyer_company,
                buyer_role: buyerFormData.buyer_role,
                linkedin_url: buyerFormData.linkedin_url || null,
                tier: buyerFormData.tier || 'basic'
              }
            }
          });
          
          console.log('✅ Auth signup result:', authResult);
          
        } catch (networkError) {
          console.error('❌ Network error during signup:', networkError);
          toast({
            title: "Connection Error", 
            description: "Unable to connect to the authentication service. Please check your internet connection and try again.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = authResult;
      
      if (error) {
        console.error('Buyer signup error:', error);
        let errorMessage = error.message;
        
        if (error.message?.includes('User already registered')) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        } else if (error.message?.includes('Invalid email')) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message?.includes('Password should contain') || error.message?.includes('AuthWeakPasswordError')) {
          // Handle Supabase password validation error
          errorMessage = "Password must contain at least: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (minimum 6 characters)";
          setPasswordError(errorMessage);
        }
        
        toast({
          title: "Signup Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        console.log('✅ User found/created successfully:', data.user.email);
        
        // For OAuth users, we need to update/create the profile in user_buyers table
        if (isOAuthUser) {
          console.log('📝 Creating/updating buyer profile for OAuth user with atomic utility...');
          
          const profileResult = await createBuyerProfileAtomic({
            id: data.user.id,
            email: buyerFormData.email,
            full_name: buyerFormData.full_name,
            buyer_company: buyerFormData.buyer_company,
            buyer_role: buyerFormData.buyer_role,
            linkedin_url: buyerFormData.linkedin_url || null,
            tier: buyerFormData.tier || 'basic',
            requested: false
          }, {
            maxRetries: 3,
            allowUpdate: true,
            waitForTrigger: false // OAuth users don't use triggers
          });
          
          if (!profileResult.success) {
            console.error('❌ Atomic profile creation error:', profileResult.error);
            toast({
              title: "Profile Update Failed",
              description: `Failed to save profile data: ${profileResult.error}`,
              variant: "destructive"
            });
            return;
          }
          
          if (profileResult.existed) {
            console.log('✅ OAuth buyer profile already existed');
          } else if (profileResult.created) {
            console.log('✅ OAuth buyer profile created successfully');
          } else if (profileResult.updated) {
            console.log('✅ OAuth buyer profile updated successfully');
          }
          
          // Send Slack notification for successful signup (non-blocking)
          setTimeout(async () => {
            try {
              await notifyBuyerSignup({
                fullName: buyerFormData.full_name,
                email: buyerFormData.email,
                company: buyerFormData.buyer_company,
                role: buyerFormData.buyer_role,
                linkedinUrl: buyerFormData.linkedin_url,
                authType: 'google',
                success: true,
                tier: buyerFormData.tier || 'basic'
              });
              console.log('✅ Slack notification sent for buyer signup');
            } catch (slackError) {
              console.error('⚠️ Failed to send Slack notification (non-blocking):', slackError);
            }
          }, 100);

          // Send welcome email immediately for OAuth users (they're already verified)
          try {
            await sendWelcomeEmail({
              userName: buyerFormData.full_name,
              userEmail: buyerFormData.email,
              accountType: 'buyer',
              dashboardUrl: window.location.origin + '/buyers/home',
              loginUrl: window.location.origin + '/signin'
            });
            console.log('✅ Welcome email sent for OAuth buyer:', buyerFormData.email);
          } catch (emailError) {
            console.error('⚠️ Failed to send welcome email (non-blocking):', emailError);
          }
          
          toast({
            title: "Profile Completed!",
            description: "Your buyer profile has been created successfully."
          });
          navigate('/buyers/home');
        } else {
          console.log('📝 Profile should be created by database trigger from metadata');
          
          // Send Slack notification for successful signup (non-blocking)
          setTimeout(async () => {
            try {
              await notifyBuyerSignup({
                fullName: buyerFormData.full_name,
                email: buyerFormData.email,
                company: buyerFormData.buyer_company,
                role: buyerFormData.buyer_role,
                linkedinUrl: buyerFormData.linkedin_url,
                authType: 'email',
                success: true,
                tier: buyerFormData.tier || 'basic'
              });
              console.log('✅ Slack notification sent for buyer signup');
            } catch (slackError) {
              console.error('⚠️ Failed to send Slack notification (non-blocking):', slackError);
            }
          }, 100);

          // Welcome email will be sent after email verification via auth state change
          
          toast({
            title: "Account Created Successfully!",
            description: "Please check your email for verification before signing in."
          });
          navigate(`/signin/buyer?from=signup&email=${encodeURIComponent(buyerFormData.email)}`);
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
        console.log('🔍 OAuth user ID length:', oAuthUserId.length);
        console.log('🔍 OAuth user ID format check:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(oAuthUserId));
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
        console.log('🔍 Session user ID:', session.user.id);
        console.log('🔍 Session user ID length:', session.user.id.length);
        console.log('🔍 URL user ID vs Session user ID match:', oAuthUserId === session.user.id);

        try {
          await supabase.auth.updateUser({
            data: {
              account_type: accountType,
              full_name: creatorFormData.full_name,
              pen_name: creatorFormData.pen_name,
              ip_owner_role: creatorFormData.ip_owner_role || null,
              ip_owner_company: creatorFormData.ip_owner_company || null,
              website_url: creatorFormData.website_url || null,
              invitation_status: creatorFormData.invitation_status || 'invited',
              updated_via: 'signup_form_creator_oauth'
            }
          });
          console.log('🔄 OAuth creator signup: Complete metadata updated', {
            account_type: accountType,
            full_name: creatorFormData.full_name,
            pen_name: creatorFormData.pen_name,
            invitation_status: creatorFormData.invitation_status || 'invited'
          });
        } catch (updateError) {
          console.error('⚠️ OAuth signup: Failed to update user metadata:', updateError);
        }

        // Use the session user ID (trust Supabase canonical value)
        authResult = { data: { user: session.user }, error: null };
      } else {
        // Regular email signup
        authResult = await supabase.auth.signUp({
          email: creatorFormData.email,
          password: creatorFormData.password,
          options: {
            emailRedirectTo: `${window.location.hostname === 'localhost' ? (import.meta.env.VITE_DASHBOARD_URL || window.location.origin) : 'https://dashboard.kstorybridge.com'}/signin/creator?verified=true`,
            data: {
              full_name: creatorFormData.full_name,
              account_type: 'creator',
              pen_name: creatorFormData.pen_name,
              ip_owner_role: creatorFormData.ip_owner_role,
              ip_owner_company: creatorFormData.ip_owner_company,
              website_url: creatorFormData.website_url || null,
              invitation_status: creatorFormData.invitation_status || 'invited'
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
        } else if (error.message?.includes('Password should contain') || error.message?.includes('AuthWeakPasswordError')) {
          // Handle Supabase password validation error
          errorMessage = "Password must contain at least: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (minimum 6 characters)";
          setPasswordError(errorMessage);
        }
        
        toast({
          title: "Signup Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (data.user) {
        console.log('👤 Creator signup successful for user:', data.user.email);
        console.log('🔒 Auth state:', { uid: data.user.id, email: data.user.email });
        
        if (isOAuthUser) {
          // For OAuth creators, we need to manually create the profile using atomic utility
          console.log('📝 Creating OAuth creator profile with atomic utility...');
          
          console.log('🔍 Using user ID for profile creation:', data.user.id);
          console.log('🔍 Profile creation user ID length:', data.user.id.length);
          
          const profileResult = await createCreatorProfileAtomic({
            id: data.user.id, // This should be the correct UUID from session
            email: creatorFormData.email,
            full_name: creatorFormData.full_name,
            pen_name: creatorFormData.pen_name,
            ip_owner_role: creatorFormData.ip_owner_role || null,
            ip_owner_company: creatorFormData.ip_owner_company || null,
            website_url: creatorFormData.website_url || null,
            invitation_status: creatorFormData.invitation_status || 'invited'
          }, {
            maxRetries: 3,
            allowUpdate: true,
            waitForTrigger: false // OAuth users don't use triggers
          });

          if (!profileResult.success) {
            console.error('❌ Atomic creator profile creation error:', profileResult.error);
            toast({
              title: "Profile Creation Failed",
              description: `Profile creation failed: ${profileResult.error}. Please try again.`,
              variant: "destructive"
            });
            return;
          }
          
          if (profileResult.existed) {
            console.log('✅ OAuth creator profile already existed');
          } else if (profileResult.created) {
            console.log('✅ OAuth creator profile created successfully');
          } else if (profileResult.updated) {
            console.log('✅ OAuth creator profile updated successfully');
          }
          
          // Skip metadata update for OAuth users to avoid hanging
          // Profile has been created successfully, that's what matters
          console.log('🚀 Skipping metadata update for OAuth creator profile completion');
        } else {
          // For email signups, the database trigger should have automatically created the profile
          console.log('✅ Profile creation handled by database trigger');
        }

        // Send notifications asynchronously (non-blocking)
        setTimeout(async () => {
          try {
            await notifyCreatorSignup({
              fullName: creatorFormData.full_name,
              email: creatorFormData.email,
              penName: creatorFormData.pen_name,
              company: creatorFormData.ip_owner_company,
              role: creatorFormData.ip_owner_role,
              websiteUrl: creatorFormData.website_url,
              authType: isOAuthUser ? 'google' : 'email',
              success: true,
            });
            console.log('✅ Slack notification sent for creator signup');
          } catch (slackError) {
            console.error('⚠️ Failed to send Slack notification (non-blocking):', slackError);
          }
        }, 100);

        // Success handling
        if (isOAuthUser) {
          // Clear OAuth completion pending flag since profile creation succeeded
          sessionStorage.removeItem('oauth_completion_pending');
          // Send welcome email immediately for OAuth users (they're already verified)
          try {
            await sendWelcomeEmail({
              userName: creatorFormData.full_name,
              userEmail: creatorFormData.email,
              accountType: 'creator',
              dashboardUrl: window.location.origin + '/creators/home/',
              loginUrl: window.location.origin + '/signin'
            });
            console.log('✅ Welcome email sent for OAuth creator:', creatorFormData.email);
          } catch (emailError) {
            console.error('⚠️ Failed to send welcome email (non-blocking):', emailError);
          }
          
          toast({
            title: "Profile Completed!",
            description: "Your creator profile has been created successfully."
          });
          navigate('/creators/home/');
        } else {
          toast({
            title: "Account Created Successfully!",
            description: "Please check your email for verification before signing in."
          });
          navigate(`/signin/creator?from=signup&email=${encodeURIComponent(creatorFormData.email)}`);
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
                  onChange={(e) => updateFormData('email', e.target.value)}
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
                  onChange={handlePasswordChange}
                  onBlur={() => {
                    const password = accountType === 'buyer' ? buyerFormData.password : creatorFormData.password;
                    if (password) {
                      const error = validatePassword(password);
                      setPasswordError(error);
                    }
                  }}
                  className={`h-12 text-base ${passwordError ? 'border-red-500' : 'border-midnight-ink-200'} focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg`}
                  placeholder="Min. 6 chars, include uppercase, lowercase, number & special char"
                  required
                />
                {passwordError && (
                  <p className="text-sm text-red-500 mt-1">
                    {passwordError}
                  </p>
                )}
                <p className="text-xs text-midnight-ink-500 mt-1">
                  Password must contain at least: 1 uppercase, 1 lowercase, 1 number, and 1 special character
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-midnight-ink">
                Full Name * {isOAuthUser && <span className="text-xs text-green-600">(from Google)</span>}
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.full_name}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                className={`h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg ${
                  isOAuthUser ? 'bg-gray-50 text-gray-700' : ''
                }`}
                placeholder={isOAuthUser ? "Name from your Google account" : "Enter your full name"}
                required
                disabled={isOAuthUser}
              />
              {isOAuthUser && (
                <p className="text-xs text-gray-500 mt-1">
                  This information was automatically filled from your Google account
                </p>
              )}
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
                    value={buyerFormData.buyer_company}
                    onChange={(e) => updateBuyerFormData('buyer_company', e.target.value)}
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
                    value={buyerFormData.buyer_role}
                    onValueChange={(value) => {
                      updateBuyerFormData('buyer_role', value);
                      setRoleError(null); // Clear error when user selects a role
                    }}
                  >
                    <SelectTrigger className={`h-12 text-base ${roleError ? 'border-red-500' : 'border-midnight-ink-200'} focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg [&>span]:pr-2`}>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--radix-select-trigger-width)]">
                      <SelectItem value="producer" className="pr-2">Producer</SelectItem>
                      <SelectItem value="executive" className="pr-2">Executive</SelectItem>
                      <SelectItem value="agent" className="pr-2">Agent</SelectItem>
                      <SelectItem value="content_scout" className="pr-2">Content Scout</SelectItem>
                      <SelectItem value="other" className="pr-2">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {roleError && (
                    <p className="text-sm text-red-500 mt-1">
                      {roleError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl" className="text-sm font-medium text-midnight-ink">
                    LinkedIn Profile
                  </Label>
                  <Input
                    id="linkedinUrl"
                    type="url"
                    value={buyerFormData.linkedin_url}
                    onChange={(e) => updateBuyerFormData('linkedin_url', e.target.value)}
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
                    value={creatorFormData.pen_name}
                    onChange={(e) => updateCreatorFormData('pen_name', e.target.value)}
                    className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                    placeholder="Enter your pen name or studio name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipOwnerRole" className="text-sm font-medium text-midnight-ink">
                    Role
                  </Label>
                  <Select
                    value={creatorFormData.ip_owner_role}
                    onValueChange={(value) => updateCreatorFormData('ip_owner_role', value)}
                  >
                    <SelectTrigger className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg">
                      <SelectValue placeholder="Select your role (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="author">Author</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipOwnerCompany" className="text-sm font-medium text-midnight-ink">
                    Company / Studio
                  </Label>
                  <Input
                    id="ipOwnerCompany"
                    type="text"
                    value={creatorFormData.ip_owner_company}
                    onChange={(e) => updateCreatorFormData('ip_owner_company', e.target.value)}
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
                    value={creatorFormData.website_url}
                    onChange={(e) => updateCreatorFormData('website_url', e.target.value)}
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

          {/* Account Type Switch */}
          {!isOAuthUser && (
            <div className="mt-6 text-center">
              <p className="text-midnight-ink-600">
                {accountType === 'creator' ? (
                  <>
                    Are you a buyer?{' '}
                    <Link 
                      to="/signup/buyer" 
                      className="font-medium text-hanok-teal hover:text-hanok-teal-600 transition-colors"
                    >
                      Sign up as buyer
                    </Link>
                  </>
                ) : (
                  <>
                    Are you a creator?{' '}
                    <Link 
                      to="/signup/creator" 
                      className="font-medium text-hanok-teal hover:text-hanok-teal-600 transition-colors"
                    >
                      Sign up as creator
                    </Link>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Divider */}
          {!isOAuthUser && (
            <div className="mt-6 pt-6 border-t border-midnight-ink-100">
              <p className="text-center text-midnight-ink-600">
                Already have an account?{' '}
                <Link
                  to={`/signin/${accountType}`}
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
