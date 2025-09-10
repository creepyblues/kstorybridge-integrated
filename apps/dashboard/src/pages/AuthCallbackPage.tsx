import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { notifyUserSignin } from '@/utils/slack';
import { determineAccountType, getAccountTypeDisplayInfo, checkProfileExists } from '@/utils/accountTypeDetection';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUserRedirect = async (user: any, urlParams: URLSearchParams) => {
    try {
      console.log('🔍 AUTH CALLBACK: Processing redirect for user:', { 
        userId: user.id, 
        email: user.email
      });

      // Use centralized account type detection with URL params
      const accountTypeResult = await determineAccountType(user, {
        urlParams,
        includeDatabaseLookup: true,
        debug: true
      });

      const { accountType, profileExists, source, confidence } = accountTypeResult;
      
      console.log('🔍 AUTH CALLBACK: Account type detection result:', {
        accountType,
        profileExists,
        source,
        confidence
      });

      if (profileExists && accountType) {
        // User has a profile, redirect to appropriate dashboard
        const displayInfo = getAccountTypeDisplayInfo(accountType);
        console.log('✅ AUTH CALLBACK: Profile found, redirecting to dashboard:', displayInfo.dashboardPath);
        navigate(displayInfo.dashboardPath);
      } else {
        // No profile found, handle based on account type
        console.log('📝 AUTH CALLBACK: No profile found, checking account type');
        
        const finalAccountType = accountType || 'buyer';
        
        if (finalAccountType === 'creator') {
          // For creators, always redirect to signup completion to collect full profile data
          console.log('🎨 AUTH CALLBACK: Redirecting creator to signup completion for full profile data');
          const displayInfo = getAccountTypeDisplayInfo(finalAccountType);
          navigate(`${displayInfo.signupPath}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`);
        } else {
          // For buyers, redirect to signup completion
          const displayInfo = getAccountTypeDisplayInfo(finalAccountType);
          console.log('📝 AUTH CALLBACK: Redirecting to signup:', displayInfo.signupPath);
          navigate(`${displayInfo.signupPath}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`);
        }
      }
    } catch (error) {
      console.error('Error in handleUserRedirect:', error);
      navigate('/signin');
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 AUTH CALLBACK: Processing OAuth callback');
        
        // Get session from URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AUTH CALLBACK: Error getting session:', error);
          
          // Store rejection info and redirect to signup
          if (error.message?.includes('Signup not allowed') || 
              error.message?.includes('Email domain')) {
            sessionStorage.setItem('signupRejection', JSON.stringify({
              email: 'unknown',
              message: error.message,
              timestamp: Date.now()
            }));
            navigate('/signup/buyer');
            return;
          }
          
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive"
          });
          navigate('/signin');
          return;
        }

        const { session } = data;
        
        if (!session?.user) {
          console.log('❌ AUTH CALLBACK: No session or user found');
          navigate('/signin');
          return;
        }

        const user = session.user;
        console.log('✅ AUTH CALLBACK: Session found for user:', user.email);

        // Check if we need to update user metadata with account_type from URL
        const urlParams = new URLSearchParams(window.location.search);
        const urlAccountType = urlParams.get('account_type');
        
        if (urlAccountType && (urlAccountType === 'buyer' || urlAccountType === 'creator')) {
          const currentAccountType = user.user_metadata?.account_type;
          
          if (!currentAccountType || currentAccountType !== urlAccountType) {
            console.log('🔄 AUTH CALLBACK: Setting account_type in metadata:', { 
              current: currentAccountType, 
              new: urlAccountType 
            });
            
            try {
              // Update user metadata with the account type from URL
              const { error: updateError } = await supabase.auth.updateUser({
                data: {
                  ...user.user_metadata,
                  account_type: urlAccountType
                }
              });
              
              if (updateError) {
                console.error('❌ AUTH CALLBACK: Error updating user metadata:', updateError);
              } else {
                console.log('✅ AUTH CALLBACK: Successfully updated user metadata with account_type');
                // Update the local user object so the redirect logic uses the correct type
                user.user_metadata = {
                  ...user.user_metadata,
                  account_type: urlAccountType
                };
              }
            } catch (metadataError) {
              console.error('❌ AUTH CALLBACK: Error updating metadata:', metadataError);
            }
          }
        }

        // Send signin notification (non-blocking) - get basic info for notification
        try {
          // Get account type quickly for notification (reuse urlParams from above)
          const quickAccountType = await determineAccountType(user, {
            urlParams,
            includeDatabaseLookup: false, // Skip database lookup for performance
            debug: false
          });

          const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
          const userType = quickAccountType.accountType === 'creator' ? 'creator' : 'buyer';
          const company = user.user_metadata?.company || user.user_metadata?.pen_name || user.user_metadata?.buyer_company;
          
          notifyUserSignin({
            fullName,
            email: user.email,
            userType,
            signinMethod: 'oauth',
            company
          }).catch(error => {
            console.error('Failed to send OAuth signin notification:', error);
          });
        } catch (error) {
          console.error('Error preparing OAuth signin notification:', error);
        }

        // Handle user redirect using centralized logic
        try {
          await handleUserRedirect(user, urlParams);
        } catch (redirectError) {
          console.error('❌ AUTH CALLBACK: Error during redirect:', redirectError);
          // Fallback to signin page
          navigate('/signin');
        }
      } catch (error) {
        console.error('❌ AUTH CALLBACK: Unexpected error:', error);
        toast({
          title: "Authentication Error",
          description: "Something went wrong during authentication. Please try again.",
          variant: "destructive"
        });
        navigate('/signin');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-midnight-ink mb-2">
          Completing Sign In
        </h2>
        <p className="text-midnight-ink-600">
          Please wait while we set up your account...
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;