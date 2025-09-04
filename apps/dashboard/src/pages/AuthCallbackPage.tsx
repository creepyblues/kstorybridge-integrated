import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { notifyUserSignin } from '@/utils/slack';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkTierAndRedirect = async (user: any, buyerProfile: any, ipOwnerProfile: any) => {
    try {
      console.log('🔍 AUTH CALLBACK: Checking tier for user:', { 
        userId: user.id, 
        email: user.email,
        buyerProfile: !!buyerProfile,
        ipOwnerProfile: !!ipOwnerProfile
      });

      if (buyerProfile) {
        // Check buyer tier
        if (buyerProfile.tier && buyerProfile.tier !== 'invited') {
          console.log('✅ AUTH CALLBACK: Buyer accepted (tier: ' + buyerProfile.tier + '), redirecting to dashboard');
          navigate('/buyers/titles');
        } else {
          console.log('⚠️ AUTH CALLBACK: Buyer not accepted (tier: ' + (buyerProfile.tier || 'null') + '), redirecting to invited page');
          navigate('/invited');
        }
      } else if (ipOwnerProfile) {
        // Check creator status
        if (ipOwnerProfile.invitation_status === 'accepted') {
          console.log('✅ AUTH CALLBACK: Creator accepted, redirecting to dashboard');
          navigate('/creators/titles');
        } else {
          console.log('⚠️ AUTH CALLBACK: Creator not accepted, redirecting to invited page');
          navigate('/creator/invited');
        }
      } else {
        // No profile found, need to complete signup
        console.log('📝 AUTH CALLBACK: No profile found, completing signup');
        const accountType = user.user_metadata?.account_type || 'buyer';
        const signupUrl = accountType === 'buyer' ? '/signup/buyer' : '/signup/creator';
        navigate(`${signupUrl}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`);
      }
    } catch (error) {
      console.error('Error in checkTierAndRedirect:', error);
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

        // Check if user has existing profiles
        const [buyerResult, ipOwnerResult] = await Promise.all([
          supabase
            .from('user_buyers')
            .select('tier, email, id, full_name, buyer_company')
            .eq('email', user.email?.toLowerCase())
            .maybeSingle(),
          supabase
            .from('user_ipowners')
            .select('invitation_status, email, id, full_name, pen_name')
            .eq('email', user.email?.toLowerCase())
            .maybeSingle()
        ]);

        const buyerProfile = buyerResult.data;
        const ipOwnerProfile = ipOwnerResult.data;

        console.log('🔍 AUTH CALLBACK: Profile check results:', {
          buyerProfile: !!buyerProfile,
          ipOwnerProfile: !!ipOwnerProfile,
          buyerTier: buyerProfile?.tier,
          creatorStatus: ipOwnerProfile?.invitation_status
        });

        // Send signin notification (non-blocking)
        try {
          const fullName = user.user_metadata?.full_name || buyerProfile?.full_name || ipOwnerProfile?.full_name || user.email?.split('@')[0] || 'User';
          let userType: 'buyer' | 'creator' = 'buyer';
          let company = user.user_metadata?.company;
          
          if (ipOwnerProfile) {
            userType = 'creator';
            company = ipOwnerProfile.pen_name || company;
          } else if (buyerProfile) {
            userType = 'buyer';
            company = buyerProfile.buyer_company || company;
          }
          
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

        await checkTierAndRedirect(user, buyerProfile, ipOwnerProfile);
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