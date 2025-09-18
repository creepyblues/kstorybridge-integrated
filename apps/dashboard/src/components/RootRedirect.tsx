import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function RootRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<string | null>(null);

  useEffect(() => {
    const determineAccountTypeAndRedirect = async () => {
      if (!user) return;

      console.log('🏠 RootRedirect: Determining account type for user:', user.email);

      try {
        // First check user metadata
        const metadataAccountType = user.user_metadata?.account_type;
        console.log('📝 RootRedirect: User metadata account_type:', metadataAccountType);

        if (metadataAccountType === 'buyer' || metadataAccountType === 'creator') {
          setAccountType(metadataAccountType);
          const redirectPath = metadataAccountType === 'creator' ? '/creators/home' : '/buyers/home';
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
          .eq('email', user.email)
          .single();

        if (buyerProfile) {
          console.log('✅ RootRedirect: Found buyer profile, redirecting to /buyers/home');
          setAccountType('buyer');
          navigate('/buyers/home', { replace: true });
          return;
        }

        // Check creator table
        const { data: creatorProfile } = await supabase
          .from('user_creators')
          .select('id')
          .eq('email', user.email)
          .single();

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