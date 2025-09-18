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
        urlParamsSize: urlParams ? urlParams.toString().length : 0,
        urlParamsString: urlParams.toString()
      });

      // Use fast account type detection for OAuth flows - prioritize speed over database verification
      console.log('📡 AUTH CALLBACK: Using fast account type detection for OAuth...');
      console.log('📡 AUTH CALLBACK: User metadata before detection:', user.user_metadata);

      // For OAuth flows, use metadata + URL params only (skip database lookup to avoid hanging)
      const accountTypeResult = await determineAccountType(user, {
        urlParams,
        includeDatabaseLookup: false, // Skip database lookup for OAuth to prevent hanging
        debug: true
      });
      console.log('📡 AUTH CALLBACK: Fast account type detection completed');

      const { accountType, profileExists, source, confidence } = accountTypeResult;
      
      console.log('🔍 AUTH CALLBACK: Account type detection result:', {
        accountType,
        profileExists,
        source,
        confidence,
        resultObject: accountTypeResult
      });

      // Handle different OAuth flows: signin vs signup
      if (accountType === 'creator' || accountType === 'buyer') {
        console.log(`✅ AUTH CALLBACK: ${accountType} account type confirmed from ${source}`);

        // Check if this is a signin or signup flow
        const callbackUrlParams = new URLSearchParams(window.location.search);
        const isSigninFlow = callbackUrlParams.get('signin') === 'true';
        const isSignupFlow = callbackUrlParams.has('account_type');

        if (isSigninFlow) {
          // SIGNIN: User already exists, go directly to dashboard
          console.log('🏠 AUTH CALLBACK: SIGNIN flow - existing user, redirecting to dashboard');
          const displayInfo = getAccountTypeDisplayInfo(accountType);
          navigate(displayInfo.dashboardPath);
          return;
        } else if (isSignupFlow) {
          // SIGNUP: Complete the signup process if profile doesn't exist
          if (profileExists) {
            console.log('✅ AUTH CALLBACK: SIGNUP - Profile exists, redirecting to dashboard');
            const displayInfo = getAccountTypeDisplayInfo(accountType);
            navigate(displayInfo.dashboardPath);
          } else {
            console.log(`📝 AUTH CALLBACK: SIGNUP - Completing ${accountType} signup process`);
            const displayInfo = getAccountTypeDisplayInfo(accountType);
            const redirectUrl = `${displayInfo.signupPath}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`;
            console.log(`📝 AUTH CALLBACK: ${accountType} signup redirect:`, redirectUrl);
            navigate(redirectUrl);
          }
          return;
        } else {
          // Generic OAuth - determine based on profile existence
          if (profileExists) {
            console.log('✅ AUTH CALLBACK: Profile exists, redirecting to dashboard');
            const displayInfo = getAccountTypeDisplayInfo(accountType);
            navigate(displayInfo.dashboardPath);
          } else {
            console.log('❓ AUTH CALLBACK: No profile found, redirecting to account type selection');
            navigate('/account-type-selection?oauth=google');
          }
          return;
        }
      } else {
        // No account type found - Try some fallback logic first
        console.log('❓ AUTH CALLBACK: No account type determined, trying fallbacks...');

        // Emergency fast-track: If this is a fresh OAuth signin, skip database and go to account selection
        const isOAuthCallback = window.location.search.includes('code=') && !window.location.search.includes('account_type=');
        if (isOAuthCallback) {
          console.log('🚀 AUTH CALLBACK: Fresh OAuth callback detected, fast-tracking to account type selection');
          setTimeout(() => {
            navigate(`/account-type-selection?email=${encodeURIComponent(user.email)}&oauth=true`);
          }, 500); // Small delay to let logs show
          return;
        }

        // Fallback 1: Check if user already has a profile in database (quick check with timeout)
        console.log('🔍 AUTH CALLBACK: Attempting quick database fallback...');
        try {
          const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database lookup timeout')), 2000) // Reduced to 2 seconds
          );

          const [buyerResult, creatorResult] = await Promise.race([
            Promise.all([
              supabase.from('user_buyers').select('id').eq('email', user.email).maybeSingle(),
              supabase.from('user_creators').select('id').eq('email', user.email).maybeSingle()
            ]),
            timeout
          ]);

          console.log('🔍 AUTH CALLBACK: Quick lookup results:', {
            buyerData: buyerResult?.data,
            creatorData: creatorResult?.data
          });

          if (buyerResult?.data) {
            console.log('✅ AUTH CALLBACK: Found buyer profile, redirecting to buyer dashboard');
            navigate('/buyers/home');
            return;
          }

          if (creatorResult?.data) {
            console.log('✅ AUTH CALLBACK: Found creator profile, redirecting to creator dashboard');
            navigate('/creators/home');
            return;
          }
        } catch (error) {
          console.warn('⚠️ AUTH CALLBACK: Quick database lookup failed:', error);
        }

        // Fallback 2: Default to account type selection
        console.log('❓ AUTH CALLBACK: No profile found, redirecting to account type selection');
        const redirectUrl = `/account-type-selection?email=${encodeURIComponent(user.email)}`;
        console.log('❓ AUTH CALLBACK: Account selection redirect URL:', redirectUrl);
        navigate(redirectUrl);
      }
    } catch (error) {
      console.error('Error in handleUserRedirect:', error);
      navigate('/signin');
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleAuthCallback = async () => {
      console.log('🔄 AUTH CALLBACK: Starting simplified OAuth callback processing');

      // Set up a timeout to prevent infinite hanging
      timeoutId = setTimeout(() => {
        console.error('🚨 AUTH CALLBACK: Timeout - redirecting to signin');
        navigate('/signin?timeout=true');
      }, 10000);

      // Simple check for OAuth flow type
      const urlParams = new URLSearchParams(window.location.search);
      const isSignin = urlParams.get('signin') === 'true';
      const accountType = urlParams.get('account_type');

      console.log('🔍 AUTH CALLBACK: Flow detection:', { isSignin, accountType, url: window.location.href });

      try {
        console.log('🔄 AUTH CALLBACK: Processing OAuth callback');
        console.log('🌐 Current URL:', window.location.href);
        console.log('🔍 URL Search:', window.location.search);
        console.log('🔍 URL Hash:', window.location.hash);
        console.log('🔍 Hostname:', window.location.hostname);
        console.log('🔍 Origin:', window.location.origin);

        // EMERGENCY BYPASS: If we're clearly in an OAuth callback and it's taking too long,
        // skip the session exchange and go directly to account type selection
        if (urlParams.has('code') && !urlParams.has('account_type')) {
          console.log('⚡ AUTH CALLBACK: EMERGENCY BYPASS - OAuth detected, skipping session exchange');
          setTimeout(() => {
            console.log('⚡ AUTH CALLBACK: EMERGENCY BYPASS - Redirecting to account type selection');
            navigate('/account-type-selection?oauth_bypass=true');
          }, 2000); // Give 2 seconds for normal flow, then bypass
        }
        
        // Get session from URL hash - handle OAuth callback properly
        console.log('📡 Getting session from Supabase...');
        
        // First try to get current session (for direct navigation)
        let { data, error } = await supabase.auth.getSession();
        
        // If no session found, try to handle OAuth callback from URL
        if (!data.session || error) {
          console.log('🔄 No active session, attempting OAuth session exchange...');
          
          // Exchange the URL hash for a session
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('❌ AUTH CALLBACK: Error exchanging OAuth session:', sessionError);
          } else {
            data = sessionData;
            error = sessionError;
          }
        }
        
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
        console.log('🗂️ AUTH CALLBACK: App metadata:', user.app_metadata);

        // Debug: Check current port and URL structure
        console.log('🌐 AUTH CALLBACK: Current port:', window.location.port);
        console.log('🌐 AUTH CALLBACK: Full URL:', window.location.href);
        console.log('🌐 AUTH CALLBACK: URL Search Params:', window.location.search);

        // Check if we need to update user metadata with account_type from URL
        const urlParams = new URLSearchParams(window.location.search);
        let urlAccountType = urlParams.get('account_type');
        
        // Fallback to sessionStorage if URL param is missing
        if (!urlAccountType) {
          const storedAccountType = sessionStorage.getItem('oauth_account_type');
          if (storedAccountType) {
            urlAccountType = storedAccountType;
            console.log('🔍 AUTH CALLBACK: Retrieved account_type from sessionStorage:', storedAccountType);
            // Clean up sessionStorage
            sessionStorage.removeItem('oauth_account_type');
          }
        }
        
        console.log('🔍 AUTH CALLBACK: URL params analysis:', {
          fullSearch: window.location.search,
          accountTypeParam: urlAccountType,
          accountTypeSource: urlParams.get('account_type') ? 'url' : 'sessionStorage',
          allParams: Object.fromEntries(urlParams.entries())
        });
        
        if (urlAccountType && (urlAccountType === 'buyer' || urlAccountType === 'creator')) {
          const currentAccountType = user.user_metadata?.account_type;
          
          console.log('🔄 AUTH CALLBACK: Account type comparison:', {
            urlAccountType,
            currentAccountType,
            needsUpdate: !currentAccountType || currentAccountType !== urlAccountType
          });
          
          // For OAuth flows, we have the account type from URL/sessionStorage
          // Skip metadata update to avoid hanging and proceed directly to redirect
          console.log('🚀 AUTH CALLBACK: Skipping metadata update for OAuth flow, proceeding to redirect');
          
          // Update the local user object for the redirect logic
          user.user_metadata = {
            ...user.user_metadata,
            account_type: urlAccountType,
            oauth_completion_pending: 'true'
          };
          console.log('🗂️ AUTH CALLBACK: Updated local user metadata for redirect:', user.user_metadata);
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

        // Simple redirect logic based on OAuth flow type
        clearTimeout(timeoutId);

        if (isSignin) {
          // SIGNIN: Determine user's account type and redirect to dashboard
          console.log('🏠 AUTH CALLBACK: SIGNIN flow - determining account type');

          try {
            const accountTypeResult = await determineAccountType(user, {
              includeDatabaseLookup: true,
              debug: true
            });

            if (accountTypeResult.accountType) {
              const displayInfo = getAccountTypeDisplayInfo(accountTypeResult.accountType);
              console.log(`✅ AUTH CALLBACK: SIGNIN - Redirecting ${accountTypeResult.accountType} to dashboard:`, displayInfo.dashboardPath);
              navigate(displayInfo.dashboardPath);
            } else {
              console.log('❓ AUTH CALLBACK: SIGNIN - Could not determine account type, redirecting to selection');
              navigate('/account-type-selection?signin_fallback=true');
            }
          } catch (error) {
            console.error('❌ AUTH CALLBACK: SIGNIN - Error determining account type:', error);
            navigate('/signin?signin_error=true');
          }

        } else if (accountType) {
          // SIGNUP: Use the account type from URL
          console.log(`📝 AUTH CALLBACK: SIGNUP flow - ${accountType} account type`);
          const displayInfo = getAccountTypeDisplayInfo(accountType as any);
          navigate(`${displayInfo.signupPath}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`);

        } else {
          // Unknown flow - redirect to account type selection
          console.log('❓ AUTH CALLBACK: Unknown flow - redirecting to account type selection');
          navigate('/account-type-selection?unknown_flow=true');
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
        // Clear timeout and show error
        clearTimeout(timeoutId);
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

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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