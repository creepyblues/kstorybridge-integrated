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
      
      console.log('🔍 AUTH CALLBACK: Starting account type detection with params:', {
        hasUrlParams: !!urlParams,
        urlParamsSize: urlParams ? urlParams.toString().length : 0
      });

      // Use centralized account type detection with URL params
      console.log('📡 AUTH CALLBACK: Calling determineAccountType...');
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
        confidence,
        resultObject: accountTypeResult
      });

      if (profileExists && accountType) {
        // User has a profile, redirect to appropriate dashboard
        console.log('✅ AUTH CALLBACK: Profile exists, preparing dashboard redirect');
        const displayInfo = getAccountTypeDisplayInfo(accountType);
        console.log('✅ AUTH CALLBACK: Display info:', displayInfo);
        console.log('✅ AUTH CALLBACK: Redirecting to dashboard:', displayInfo.dashboardPath);
        navigate(displayInfo.dashboardPath);
      } else {
        // No profile found, handle based on account type
        console.log('📝 AUTH CALLBACK: No profile found, checking account type');
        
        const finalAccountType = accountType || 'buyer';
        console.log('📝 AUTH CALLBACK: Final account type determined:', finalAccountType);
        
        if (finalAccountType === 'creator') {
          // For creators, always redirect to signup completion to collect full profile data
          console.log('🎨 AUTH CALLBACK: Creator flow - preparing signup completion redirect');
          const displayInfo = getAccountTypeDisplayInfo(finalAccountType);
          console.log('🎨 AUTH CALLBACK: Creator display info:', displayInfo);
          const redirectUrl = `${displayInfo.signupPath}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`;
          console.log('🎨 AUTH CALLBACK: Creator redirect URL:', redirectUrl);
          navigate(redirectUrl);
        } else {
          // For buyers, redirect to signup completion
          console.log('💼 AUTH CALLBACK: Buyer flow - preparing signup completion redirect');
          const displayInfo = getAccountTypeDisplayInfo(finalAccountType);
          console.log('💼 AUTH CALLBACK: Buyer display info:', displayInfo);
          const redirectUrl = `${displayInfo.signupPath}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`;
          console.log('💼 AUTH CALLBACK: Buyer redirect URL:', redirectUrl);
          navigate(redirectUrl);
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
        console.log('🌐 Current URL:', window.location.href);
        console.log('🔍 URL Search:', window.location.search);
        console.log('🔍 URL Hash:', window.location.hash);
        console.log('🔍 Hostname:', window.location.hostname);
        console.log('🔍 Origin:', window.location.origin);
        
        // Get session from URL hash
        console.log('📡 Getting session from Supabase...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ AUTH CALLBACK: Error getting session:', error);
          console.error('❌ AUTH CALLBACK: Error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText
          });
          
          // Store rejection info and redirect to signup
          if (error.message?.includes('Signup not allowed') || 
              error.message?.includes('Email domain')) {
            console.log('🚫 AUTH CALLBACK: Signup not allowed, storing rejection info');
            sessionStorage.setItem('signupRejection', JSON.stringify({
              email: 'unknown',
              message: error.message,
              timestamp: Date.now()
            }));
            console.log('🔄 AUTH CALLBACK: Redirecting to buyer signup');
            navigate('/signup/buyer');
            return;
          }
          
          console.log('🔄 AUTH CALLBACK: Generic error, redirecting to signin');
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive"
          });
          navigate('/signin');
          return;
        }

        const { session } = data;
        console.log('📋 AUTH CALLBACK: Session data received:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          sessionId: session?.access_token ? 'present' : 'missing'
        });
        
        if (!session?.user) {
          console.log('❌ AUTH CALLBACK: No session or user found');
          console.log('🔄 AUTH CALLBACK: Redirecting to signin');
          navigate('/signin');
          return;
        }

        const user = session.user;
        console.log('✅ AUTH CALLBACK: Session found for user:', user.email);
        console.log('👤 AUTH CALLBACK: User details:', {
          id: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at,
          provider: user.app_metadata?.provider,
          providers: user.app_metadata?.providers
        });
        console.log('🗂️ AUTH CALLBACK: User metadata:', user.user_metadata);

        // Check if we need to update user metadata with account_type from URL
        const urlParams = new URLSearchParams(window.location.search);
        const urlAccountType = urlParams.get('account_type');
        
        console.log('🔍 AUTH CALLBACK: URL params analysis:', {
          fullSearch: window.location.search,
          accountTypeParam: urlAccountType,
          allParams: Object.fromEntries(urlParams.entries())
        });
        
        if (urlAccountType && (urlAccountType === 'buyer' || urlAccountType === 'creator')) {
          const currentAccountType = user.user_metadata?.account_type;
          
          console.log('🔄 AUTH CALLBACK: Account type comparison:', {
            urlAccountType,
            currentAccountType,
            needsUpdate: !currentAccountType || currentAccountType !== urlAccountType
          });
          
          if (!currentAccountType || currentAccountType !== urlAccountType) {
            console.log('🔄 AUTH CALLBACK: Setting account_type in metadata with OAuth pending flag:', { 
              current: currentAccountType, 
              new: urlAccountType 
            });
            
            try {
              console.log('📡 AUTH CALLBACK: Calling supabase.auth.updateUser...');
              // Update user metadata with the account type from URL
              // Use oauth_completion_pending flag to prevent database trigger interference
              const { error: updateError } = await supabase.auth.updateUser({
                data: {
                  ...user.user_metadata,
                  account_type: urlAccountType,
                  oauth_completion_pending: 'true' // Prevent trigger from creating profile
                }
              });
              
              if (updateError) {
                console.error('❌ AUTH CALLBACK: Error updating user metadata:', updateError);
                console.error('❌ AUTH CALLBACK: Update error details:', {
                  message: updateError.message,
                  status: updateError.status
                });
              } else {
                console.log('✅ AUTH CALLBACK: Successfully updated user metadata with account_type and pending flag');
                // Update the local user object so the redirect logic uses the correct type
                user.user_metadata = {
                  ...user.user_metadata,
                  account_type: urlAccountType,
                  oauth_completion_pending: 'true'
                };
                console.log('🗂️ AUTH CALLBACK: Updated local user metadata:', user.user_metadata);
              }
            } catch (metadataError) {
              console.error('❌ AUTH CALLBACK: Exception updating metadata:', metadataError);
            }
          } else {
            console.log('✅ AUTH CALLBACK: Account type already correct, no update needed');
          }
        } else {
          console.log('⚠️ AUTH CALLBACK: No valid account_type in URL params');
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
          console.log('🚦 AUTH CALLBACK: Starting user redirect logic');
          await handleUserRedirect(user, urlParams);
        } catch (redirectError) {
          console.error('❌ AUTH CALLBACK: Error during redirect:', redirectError);
          console.error('❌ AUTH CALLBACK: Redirect error details:', {
            message: redirectError.message,
            stack: redirectError.stack
          });
          // Fallback to signin page
          console.log('🔄 AUTH CALLBACK: Fallback redirect to signin');
          navigate('/signin');
        }
      } catch (error) {
        console.error('❌ AUTH CALLBACK: Unexpected error:', error);
        console.error('❌ AUTH CALLBACK: Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        console.error('❌ AUTH CALLBACK: Current state when error occurred:', {
          url: window.location.href,
          search: window.location.search,
          hash: window.location.hash
        });
        toast({
          title: "Authentication Error",
          description: "Something went wrong during authentication. Please try again.",
          variant: "destructive"
        });
        console.log('🔄 AUTH CALLBACK: Error fallback - redirecting to signin');
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