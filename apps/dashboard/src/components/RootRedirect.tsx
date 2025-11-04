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

      // NOTE: OAuth signin profile check removed - now handled in AuthCallbackSimple.tsx
      // This eliminates race conditions and ensures profile is verified before user reaches dashboard
      // Keeping this file for non-OAuth users who visit root URL directly

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
          console.log('✅ RootRedirect: Found buyer profile - writing metadata before redirect');

          // CRITICAL: Write metadata BEFORE redirecting (BLOCKING)
          // Ensures metadata is available on subsequent page loads
          try {
            const { error: metadataError } = await supabase.auth.updateUser({
              data: { account_type: 'buyer' }
            });

            if (metadataError) {
              console.error('❌ RootRedirect: Failed to write buyer metadata:', metadataError);
              toast({
                title: "Authentication Error",
                description: "Failed to restore account information. Please try signing in again.",
                variant: "destructive"
              });
              navigate('/signin?error=metadata_write_failed', { replace: true });
              return;
            }

            console.log('✅ RootRedirect: Buyer metadata written successfully');
          } catch (error) {
            console.error('❌ RootRedirect: Exception writing buyer metadata:', error);
            toast({
              title: "Authentication Error",
              description: "An error occurred restoring your account. Please try again.",
              variant: "destructive"
            });
            navigate('/signin?error=metadata_exception', { replace: true });
            return;
          }

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
          console.log('✅ RootRedirect: Found creator profile - writing metadata before redirect');

          // CRITICAL: Write metadata BEFORE redirecting (BLOCKING)
          // Ensures metadata is available on subsequent page loads
          try {
            const { error: metadataError } = await supabase.auth.updateUser({
              data: { account_type: 'creator' }
            });

            if (metadataError) {
              console.error('❌ RootRedirect: Failed to write creator metadata:', metadataError);
              toast({
                title: "Authentication Error",
                description: "Failed to restore account information. Please try signing in again.",
                variant: "destructive"
              });
              navigate('/signin?error=metadata_write_failed', { replace: true});
              return;
            }

            console.log('✅ RootRedirect: Creator metadata written successfully');
          } catch (error) {
            console.error('❌ RootRedirect: Exception writing creator metadata:', error);
            toast({
              title: "Authentication Error",
              description: "An error occurred restoring your account. Please try again.",
              variant: "destructive"
            });
            navigate('/signin?error=metadata_exception', { replace: true });
            return;
          }

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
