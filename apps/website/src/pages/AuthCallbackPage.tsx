import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';
import { getDashboardUrl } from '../config/urls';
import { notifySignupFailure, analyzeSignupFailure } from '../utils/slackNotifications';
import { notifyBuyerSignin, notifyCreatorSignin } from '../utils/slack';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const redirectToDashboard = async () => {
    console.log('🔄 AUTH CALLBACK: Redirecting to dashboard');
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
      console.log('🔄 AUTH CALLBACK: Redirecting to dashboard:', finalUrl.substring(0, 100) + '...');
      
      // Direct redirect to dashboard
      window.location.href = finalUrl;
    } else {
      console.error('❌ AUTH CALLBACK: No session found for authenticated user');
      toast({
        title: "Session Error",
        description: "Unable to redirect to dashboard. Please try signing in again.",
        variant: "destructive"
      });
      navigate('/signin');
    }
  };

  const checkTierAndRedirect = async (user: any, buyerProfile: any, ipOwnerProfile: any) => {
    try {
      console.log('🔍 AUTH CALLBACK: Checking tier for user:', { 
        userId: user.id, 
        email: user.email,
        buyerProfile: !!buyerProfile,
        ipOwnerProfile: !!ipOwnerProfile
      });

      if (buyerProfile) {
        // Check buyer tier - 'basic', 'pro', 'suite' should all go to dashboard
        const tier = buyerProfile.tier;
        console.log('👤 AUTH CALLBACK: Buyer profile:', {
          email: buyerProfile.email,
          tier: buyerProfile.tier,
          id: buyerProfile.id
        });
        
        // Only 'invited' or missing tier should go to invited page
        if (tier && tier !== 'invited') {
          console.log('✅ AUTH CALLBACK: Buyer accepted (tier: ' + tier + '), redirecting directly to dashboard');
          
          // Send Slack notification for successful OAuth buyer signin
          try {
            await notifyBuyerSignin({
              fullName: buyerProfile.full_name,
              email: buyerProfile.email,
              authType: 'google',
              success: true,
              tier: tier,
              redirectedTo: 'dashboard',
              company: buyerProfile.buyer_company
            });
          } catch (slackError) {
            console.error('Failed to send OAuth buyer signin notification:', slackError);
          }
          
          await redirectToDashboard();
        } else {
          console.log('⚠️ AUTH CALLBACK: Buyer not accepted (tier: ' + (tier || 'null') + '), redirecting to invited page');
          
          // Send Slack notification for OAuth buyer signin to invited page
          try {
            await notifyBuyerSignin({
              fullName: buyerProfile.full_name,
              email: buyerProfile.email,
              authType: 'google',
              success: true,
              tier: tier || 'null',
              redirectedTo: 'invited',
              company: buyerProfile.buyer_company
            });
          } catch (slackError) {
            console.error('Failed to send OAuth buyer signin notification:', slackError);
          }
          
          navigate('/invited');
        }
      } else if (ipOwnerProfile) {
        // Check IP owner invitation status
        const invitationStatus = ipOwnerProfile.invitation_status;
        console.log('👤 AUTH CALLBACK: IP owner invitation status:', invitationStatus);
        
        if (invitationStatus === 'accepted') {
          console.log('✅ AUTH CALLBACK: Creator accepted, redirecting directly to dashboard');
          
          // Send Slack notification for successful OAuth creator signin
          try {
            await notifyCreatorSignin({
              fullName: ipOwnerProfile.full_name,
              email: ipOwnerProfile.email,
              authType: 'google',
              success: true,
              invitationStatus: invitationStatus,
              redirectedTo: 'dashboard',
              penName: ipOwnerProfile.pen_name
            });
          } catch (slackError) {
            console.error('Failed to send OAuth creator signin notification:', slackError);
          }
          
          await redirectToDashboard();
        } else {
          console.log('⚠️ AUTH CALLBACK: Creator not accepted, redirecting to creator invited page');
          
          // Send Slack notification for OAuth creator signin to invited page
          try {
            await notifyCreatorSignin({
              fullName: ipOwnerProfile.full_name,
              email: ipOwnerProfile.email,
              authType: 'google',
              success: true,
              invitationStatus: invitationStatus || 'invited',
              redirectedTo: 'creator/invited',
              penName: ipOwnerProfile.pen_name
            });
          } catch (slackError) {
            console.error('Failed to send OAuth creator signin notification:', slackError);
          }
          
          navigate('/creator/invited');
        }
      } else {
        // Fallback to invited page
        console.log('⚠️ AUTH CALLBACK: No clear profile type, defaulting to invited page');
        navigate('/invited');
      }
    } catch (error) {
      console.error('❌ AUTH CALLBACK: Error checking tier:', error);
      navigate('/invited');
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check URL parameters to detect invitation type
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = urlParams.get('type') || hashParams.get('type');
        const inviteToken = urlParams.get('invite_token') || hashParams.get('invite_token');
        const invitationToken = urlParams.get('invitation_token') || hashParams.get('invitation_token');
        
        console.log('🔍 AUTH CALLBACK: Detected type:', type);
        console.log('🔍 AUTH CALLBACK: Invite token:', inviteToken ? 'present' : 'not present');
        console.log('🔍 AUTH CALLBACK: Invitation token:', invitationToken ? 'present' : 'not present');
        console.log('🔍 AUTH CALLBACK: URL params:', Object.fromEntries(urlParams));
        console.log('🔍 AUTH CALLBACK: Hash params:', Object.fromEntries(hashParams));
        
        // Handle invitation links specifically
        // Supabase invitation links typically have type=invite or type=invitation, or contain invite/invitation tokens
        if (type === 'invite' || type === 'invitation' || inviteToken || invitationToken) {
          console.log('🎯 AUTH CALLBACK: Invitation link detected, redirecting to invitation setup');
          navigate('/invitation/accept');
          return;
        }
        
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive"
          });
          navigate('/signin');
          return;
        }

        if (session?.user) {
          const user = session.user;
          
          // Check if user profile exists in either table
          console.log('🔍 AUTH CALLBACK: Checking profiles for user:', { id: user.id, email: user.email });
          
          // Try both email and id as keys since different tables might use different schemas
          const [buyerProfileById, buyerProfileByEmail, ipOwnerProfileById, ipOwnerProfileByEmail] = await Promise.all([
            supabase
              .from('user_buyers')
              .select('*')
              .eq('id', user.id)
              .maybeSingle(),
            supabase
              .from('user_buyers')
              .select('*')
              .eq('email', user.email)
              .maybeSingle(),
            supabase
              .from('user_ipowners')
              .select('*')
              .eq('id', user.id)
              .maybeSingle(),
            supabase
              .from('user_ipowners')
              .select('*')
              .eq('email', user.email)
              .maybeSingle()
          ]);
          
          console.log('🔍 AUTH CALLBACK: Profile query results:', {
            buyerById: buyerProfileById,
            buyerByEmail: buyerProfileByEmail,
            ipOwnerById: ipOwnerProfileById,
            ipOwnerByEmail: ipOwnerProfileByEmail
          });
          
          // Use whichever query returned data
          const buyerProfile = buyerProfileById.data ? buyerProfileById : buyerProfileByEmail;
          const ipOwnerProfile = ipOwnerProfileById.data ? ipOwnerProfileById : ipOwnerProfileByEmail;

          // If profile exists in either table, user has completed signup
          if (buyerProfile.data || ipOwnerProfile.data) {
            // User has completed profile, check their tier and redirect appropriately
            await checkTierAndRedirect(user, buyerProfile.data, ipOwnerProfile.data);
          } else if (user.user_metadata?.account_type === 'buyer') {
            // User is marked as buyer but has no profile - create one with basic tier
            console.log('📝 AUTH CALLBACK: Creating buyer profile with basic tier for existing auth user');
            const { data: newProfile, error: createError } = await supabase
              .from('user_buyers')
              .insert({
                id: user.id,
                email: user.email,
                tier: 'basic',
                created_at: new Date().toISOString()
              })
              .select()
              .single();
            
            if (!createError && newProfile) {
              console.log('✅ AUTH CALLBACK: Created buyer profile with basic tier');
              
              // Send Slack notification for new OAuth profile creation
              try {
                await notifyBuyerSignin({
                  fullName: 'OAuth Profile Created',
                  email: user.email,
                  authType: 'google',
                  success: true,
                  tier: 'basic',
                  redirectedTo: 'dashboard'
                });
              } catch (slackError) {
                console.error('Failed to send OAuth profile creation notification:', slackError);
              }
              
              await redirectToDashboard();
            } else {
              console.error('Error creating buyer profile:', createError);
              navigate('/invited');
            }
          } else {
            // No profile exists, need to complete signup
            // First, check if this is a buyer account type and validate email domain
            const urlParams = new URLSearchParams(window.location.search);
            const accountType = urlParams.get('account_type') || 'buyer';
            
            // Apply email restrictions for buyer accounts
            if (accountType === 'buyer') {
              // List of common consumer email providers to exclude (same as SignupForm.tsx)
              const consumerEmailProviders = [
                'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
                'icloud.com', 'protonmail.com', 'mail.com', 'yandex.com', 'zoho.com',
                'live.com', 'msn.com', 'comcast.net', 'verizon.net', 'att.net',
                'sbcglobal.net', 'cox.net', 'charter.net', 'earthlink.net', 'me.com'
              ];
              
              const isWorkEmail = (email: string) => {
                const domain = email.split('@')[1]?.toLowerCase();
                return domain && !consumerEmailProviders.includes(domain);
              };
              
              if (!isWorkEmail(user.email)) {
                console.log('Personal email not allowed for buyer signup:', user.email);
                
                // Send Slack notification for OAuth signup failure due to personal email
                try {
                  const mockError = {
                    message: 'Personal email addresses are not allowed for buyer accounts',
                    code: 'personal_email_rejected'
                  };
                  const analysis = analyzeSignupFailure(mockError);
                  
                  await notifySignupFailure({
                    email: user.email,
                    accountType: 'buyer',
                    errorMessage: 'Personal email addresses are not allowed for buyer accounts. Please use a work email address.',
                    errorCode: 'personal_email_rejected',
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    additionalContext: {
                      authType: 'OAuth (Google)',
                      step: 'Email validation in auth callback',
                      rejectionReason: 'Personal email domain detected',
                      emailDomain: user.email.split('@')[1],
                      ...analysis
                    }
                  });
                } catch (slackError) {
                  console.error('Failed to send personal email rejection notification:', slackError);
                }
                
                // Store the rejection reason in sessionStorage to show on signup page
                sessionStorage.setItem('signupRejection', JSON.stringify({
                  reason: 'personal_email',
                  email: user.email,
                  message: 'Personal email addresses are not allowed for buyer accounts. Please use a work email address.',
                  timestamp: Date.now()
                }));
                
                toast({
                  title: "Work Email Required",
                  description: "Personal email providers are not allowed for buyer accounts. Please use a work email address.",
                  variant: "destructive"
                });
                
                // Sign out the user and redirect to signup page
                await supabase.auth.signOut();
                navigate('/signup/buyer');
                return;
              }
            }
            
            // Store OAuth user data in session storage for the signup form
            sessionStorage.setItem('oauthUser', JSON.stringify({
              id: user.id,
              email: user.email,
              fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
              isOAuth: true
            }));
            
            // Redirect to appropriate signup completion page
            navigate(`/signup/${accountType}?complete=true`, { replace: true });
          }
        } else {
          // No session found
          navigate('/signin');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        toast({
          title: "Unexpected Error",
          description: "Something went wrong. Please try again.",
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
        <p className="text-lg text-midnight-ink">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;