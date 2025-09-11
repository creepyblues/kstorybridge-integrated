import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType } from "@/utils/accountTypeDetection";

export function DashboardEntrypoint() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Memoize the options object to prevent unnecessary re-renders
  const accountTypeOptions = useMemo(() => ({
    includeDatabaseLookup: true,
    debug: true
  }), []);
  
  // Only use account type detection if user is authenticated
  const { 
    accountType, 
    loading: accountTypeLoading 
  } = useAccountType(accountTypeOptions);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected) return;

    console.log('🏠 DashboardEntrypoint: Checking user status', {
      user: user?.email,
      authLoading,
      accountTypeLoading,
      accountType
    });

    // If still loading authentication, wait
    if (authLoading) {
      console.log('🔄 DashboardEntrypoint: Waiting for auth to complete...');
      return;
    }

    // If no user, redirect to signin
    if (!user) {
      console.log('🔒 DashboardEntrypoint: No user found, redirecting to signin');
      setHasRedirected(true);
      navigate('/signin', { replace: true });
      return;
    }

    // If user exists but still loading account type, wait
    if (accountTypeLoading) {
      console.log('🔄 DashboardEntrypoint: Waiting for account type detection...');
      return;
    }

    // User is authenticated, determine redirect path based on account type
    let redirectPath: string;
    
    if (accountType === 'creator') {
      redirectPath = '/creators/home';
    } else if (accountType === 'buyer') {
      redirectPath = '/buyers/home';
    } else {
      // Fallback for unknown account types - default to buyer for backward compatibility
      console.log('⚠️ DashboardEntrypoint: Unknown account type, defaulting to buyer home', {
        accountType,
        userEmail: user.email
      });
      redirectPath = '/buyers/home';
    }
    
    console.log('✅ DashboardEntrypoint: Redirecting authenticated user to:', redirectPath, {
      accountType,
      userEmail: user.email
    });
    
    setHasRedirected(true);
    navigate(redirectPath, { replace: true });

  }, [user, authLoading, accountTypeLoading, accountType, navigate, hasRedirected]);

  // Show loading state
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">
          {authLoading 
            ? 'Checking authentication...' 
            : accountTypeLoading 
            ? 'Loading dashboard...' 
            : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
}