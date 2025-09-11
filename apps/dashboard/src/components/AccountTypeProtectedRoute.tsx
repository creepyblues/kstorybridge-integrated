import { ReactNode, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAccountType, getAccountTypeDisplayInfo, type AccountType } from "@/utils/accountTypeDetection";

interface AccountTypeProtectedRouteProps {
  children: ReactNode;
  allowedAccountTypes: AccountType[];
}

export function AccountTypeProtectedRoute({ children, allowedAccountTypes }: AccountTypeProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use centralized account type detection with static options
  const { 
    accountType, 
    loading: accountTypeLoading, 
    source, 
    confidence,
    profileExists 
  } = useAccountType({
    includeDatabaseLookup: true,
    debug: true
  });

  useEffect(() => {
    // Only perform protection check when auth and account type detection are complete
    // AND we have a definitive account type (not null/undefined)
    if (!authLoading && !accountTypeLoading && user && accountType !== null && accountType !== undefined) {
      const isAllowed = allowedAccountTypes.includes(accountType);
      
      console.log('🛡️ Account type protection check:', {
        userEmail: user.email,
        accountType,
        allowedAccountTypes,
        isAllowed,
        currentPath: location.pathname,
        source,
        confidence,
        profileExists,
        authLoading,
        accountTypeLoading
      });

      if (!isAllowed) {
        // Use centralized display info for consistent routing
        const displayInfo = getAccountTypeDisplayInfo(accountType);
        console.log('🚫 Access denied, redirecting to:', displayInfo.homePath);
        navigate(displayInfo.homePath, { replace: true });
      }
    } else {
      // Debug logging to understand the state
      console.log('🔄 Account type protection waiting:', {
        authLoading,
        accountTypeLoading,
        hasUser: !!user,
        accountType,
        currentPath: location.pathname
      });
    }
  }, [authLoading, accountTypeLoading, user, accountType, allowedAccountTypes, navigate, location.pathname, source, confidence, profileExists]);

  // Show loading while auth or account type is loading
  if (authLoading || accountTypeLoading) {
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