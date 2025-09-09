import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AccountTypeProtectedRouteProps {
  children: ReactNode;
  allowedAccountTypes: ('buyer' | 'ip_owner')[];
}

type AccountType = 'buyer' | 'ip_owner' | null;

export function AccountTypeProtectedRoute({ children, allowedAccountTypes }: AccountTypeProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const determineAccountType = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      console.log('🔍 Determining account type for user:', user.email);

      try {
        // First check user metadata
        const metadataAccountType = user.user_metadata?.account_type;
        console.log('📝 User metadata account_type:', metadataAccountType);

        if (metadataAccountType === 'buyer' || metadataAccountType === 'ip_owner') {
          setAccountType(metadataAccountType);
          setLoading(false);
          return;
        }

        // If no metadata, check database tables
        console.log('🔍 Checking database for account type...');
        
        // Check buyer table
        const { data: buyerProfile } = await supabase
          .from('user_buyers')
          .select('id')
          .eq('email', user.email)
          .single();

        if (buyerProfile) {
          console.log('✅ Found buyer profile');
          setAccountType('buyer');
          setLoading(false);
          return;
        }

        // Check IP owner table
        const { data: ipOwnerProfile } = await supabase
          .from('user_ipowners')
          .select('id')
          .eq('email', user.email)
          .single();

        if (ipOwnerProfile) {
          console.log('✅ Found IP owner profile');
          setAccountType('ip_owner');
          setLoading(false);
          return;
        }

        // No profile found - default to buyer for backward compatibility
        console.log('⚠️ No profile found, defaulting to buyer');
        setAccountType('buyer');
        setLoading(false);

      } catch (error) {
        console.error('❌ Error determining account type:', error);
        // Default to buyer on error for backward compatibility
        setAccountType('buyer');
        setLoading(false);
      }
    };

    determineAccountType();
  }, [user]);

  useEffect(() => {
    if (!authLoading && !loading && user && accountType) {
      const isAllowed = allowedAccountTypes.includes(accountType);
      
      console.log('🛡️ Account type protection check:', {
        userEmail: user.email,
        accountType,
        allowedAccountTypes,
        isAllowed,
        currentPath: location.pathname
      });

      if (!isAllowed) {
        // Redirect to appropriate dashboard based on account type
        const redirectPath = accountType === 'buyer' ? '/buyers/home' : '/creators/home';
        console.log('🚫 Access denied, redirecting to:', redirectPath);
        navigate(redirectPath, { replace: true });
      }
    }
  }, [authLoading, loading, user, accountType, allowedAccountTypes, navigate, location.pathname]);

  // Show loading while auth or account type is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // Show loading if user not authenticated (ProtectedRoute should handle redirect)
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If account type is not allowed, show loading while redirecting
  if (accountType && !allowedAccountTypes.includes(accountType)) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}