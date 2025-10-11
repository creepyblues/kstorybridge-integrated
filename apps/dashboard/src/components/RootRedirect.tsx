import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function RootRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accountType, setAccountType] = useState<string | null>(null);

  useEffect(() => {
    const determineAccountTypeAndRedirect = async () => {
      if (!user) return;

      console.log('🏠 RootRedirect: Determining account type for user:', user.email);

      // Check for pending OAuth signin (needs profile verification)
      const isPendingOAuth = sessionStorage.getItem('oauth_signin_pending');

      if (isPendingOAuth === 'true') {
        console.log('🔍 RootRedirect: OAuth signin detected - verifying profile existence');

        const oauthAccountType = sessionStorage.getItem('oauth_signin_account_type');
        const oauthUserId = sessionStorage.getItem('oauth_signin_user_id');
        const oauthEmail = sessionStorage.getItem('oauth_signin_email');

        // Clear OAuth flags immediately to prevent re-checking
        sessionStorage.removeItem('oauth_signin_pending');
        sessionStorage.removeItem('oauth_signin_account_type');
        sessionStorage.removeItem('oauth_signin_user_id');
        sessionStorage.removeItem('oauth_signin_email');

        if (oauthAccountType && oauthUserId) {
          try {
            // Check if profile exists in database
            let profileExists = false;

            if (oauthAccountType === 'buyer') {
              const { data } = await supabase
                .from('user_buyers')
                .select('id')
                .eq('id', oauthUserId)
                .maybeSingle();
              profileExists = !!data;
            } else if (oauthAccountType === 'creator') {
              const { data } = await supabase
                .from('user_creators')
                .select('id')
                .eq('id', oauthUserId)
                .maybeSingle();
              profileExists = !!data;
            }

            if (!profileExists) {
              // No profile found - redirect to signup
              console.log('❌ RootRedirect: OAuth user has no profile - redirecting to signup');
              toast({
                title: "Account Not Found",
                description: "Your account doesn't exist. Please sign up first.",
                variant: "destructive"
              });
              setTimeout(() => {
                navigate(`/signup/${oauthAccountType}`, { replace: true });
              }, 2000);
              return;
            }

            console.log('✅ RootRedirect: OAuth profile verified - continuing to dashboard');
            // Profile exists - fall through to normal redirect logic below
          } catch (error) {
            console.error('❌ RootRedirect: Error checking OAuth profile:', error);
            // On error, redirect to signup to be safe
            toast({
              title: "Verification Error",
              description: "Unable to verify your account. Please sign up.",
              variant: "destructive"
            });
            setTimeout(() => {
              navigate(`/signup/${oauthAccountType}`, { replace: true });
            }, 2000);
            return;
          }
        }
      }

      try {
        // First check user metadata
        const metadataAccountType = user.user_metadata?.account_type;
        console.log('📝 RootRedirect: User metadata account_type:', metadataAccountType);

        if (metadataAccountType === 'buyer' || metadataAccountType === 'creator') {
          setAccountType(metadataAccountType);
          const redirectPath = metadataAccountType === 'creator' ? '/creators/home' : '/buyers/chat';
          console.log('🏠 RootRedirect: Redirecting to:', redirectPath);
          navigate(redirectPath, { replace: true });
          return;
        }

        // If no metadata, check database tables
        console.log('🔍 RootRedirect: Checking database for account type...');
        
        // Check buyer table
        const { data: buyerProfile } = await supabase
          .from('user_buyers')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (buyerProfile) {
          console.log('✅ RootRedirect: Found buyer profile, redirecting to /buyers/chat');
          setAccountType('buyer');
          navigate('/buyers/chat', { replace: true });
          return;
        }

        // Check creator table
        const { data: creatorProfile } = await supabase
          .from('user_creators')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (creatorProfile) {
          console.log('✅ RootRedirect: Found creator profile, redirecting to /creators/home');
          setAccountType('creator');
          navigate('/creators/home', { replace: true });
          return;
        }

        // No profile found - redirect to signin to choose account type
        console.log('⚠️ RootRedirect: No profile found, redirecting to signin');
        navigate('/signin?no_profile=true', { replace: true });

      } catch (error) {
        console.error('❌ RootRedirect: Error determining account type:', error);
        // Redirect to signin on error instead of defaulting to buyer
        navigate('/signin?error=true', { replace: true });
      }
    };

    determineAccountTypeAndRedirect();
  }, [user, navigate]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Loading...</div>
    </div>
  );
}
