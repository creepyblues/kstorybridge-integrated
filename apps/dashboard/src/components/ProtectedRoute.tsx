
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { getWebsiteUrl } from "@/config/urls";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const authTimeoutRef = useRef<NodeJS.Timeout>();

  // Check if we should bypass auth for localhost development
  const shouldBypassAuth = () => {
    const isLocalhost = window.location.hostname === 'localhost';
    const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
    const isDev = import.meta.env.DEV;
    
    console.log('🚨 PROTECTED ROUTE BYPASS CHECK:', {
      isLocalhost,
      bypassEnabled,
      isDev,
      envVar: import.meta.env.VITE_DISABLE_AUTH_LOCALHOST,
      shouldBypass: isLocalhost && bypassEnabled && isDev
    });
    
    if (isLocalhost && bypassEnabled && isDev) {
      console.log('🚨 PROTECTED ROUTE BYPASS: Auth bypass enabled for localhost');
      return true;
    }
    return false;
  };

  useEffect(() => {
    // Check if we have auth tokens in URL indicating auth flow in progress
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthTokens = urlParams.has('access_token');
    
    console.log('🛡️ PROTECTED ROUTE EFFECT:', {
      loading,
      hasUser: !!user,
      userEmail: user?.email,
      hasAuthTokens,
      willRedirect: !loading && !user && !hasAuthTokens,
      currentUrl: window.location.href,
      currentHostname: window.location.hostname,
      isDev: import.meta.env.DEV,
      env: import.meta.env.MODE
    });
    
    // Don't redirect if auth is still loading OR if we have auth tokens in URL (auth flow in progress)
    // Also don't redirect if localhost auth bypass is enabled
    const bypassEnabled = shouldBypassAuth();
    console.log('🚨 PROTECTED ROUTE: Auth bypass check:', { bypassEnabled });
    
    if (!loading && !user && !hasAuthTokens && !bypassEnabled) {
      console.log('🚨 PROTECTED ROUTE: Redirecting to website - no user authenticated and no auth flow in progress');
      const websiteUrl = getWebsiteUrl();
      const signinUrl = `${websiteUrl}/signin`;
      const websiteUrlWithParam = `${signinUrl}${signinUrl.includes('?') ? '&' : '?'}from_dashboard=true`;
      console.log('🚨 PROTECTED ROUTE: Redirecting to:', websiteUrlWithParam);
      console.log('🚨 PROTECTED ROUTE: Current URL:', window.location.href);
      
      // Small delay to prevent rapid redirects
      setTimeout(() => {
        console.log('🚨 PROTECTED ROUTE: Executing redirect now');
        window.location.href = websiteUrlWithParam;
      }, 200);
    } else if (!loading && user) {
      console.log('✅ PROTECTED ROUTE: User authenticated, allowing access');
    } else if (hasAuthTokens) {
      console.log('🔄 PROTECTED ROUTE: Auth flow in progress, waiting for completion...');
      
      // Set a timeout in case the auth flow fails and we're waiting forever
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
      
      authTimeoutRef.current = setTimeout(() => {
        console.log('⏰ PROTECTED ROUTE: Auth flow timeout - tokens may be invalid');
        if (!user) {
          console.log('🚨 PROTECTED ROUTE: Timeout reached, redirecting to website signin');
          const websiteUrl = getWebsiteUrl();
          const signinUrl = `${websiteUrl}/signin`;
          const websiteUrlWithParam = `${signinUrl}${signinUrl.includes('?') ? '&' : '?'}from_dashboard=true`;
          window.location.href = websiteUrlWithParam;
        }
      }, 5000); // 5 second timeout
    }
    
    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // If auth bypass is enabled, always allow access even without a user object
  if (shouldBypassAuth()) {
    console.log('🚨 PROTECTED ROUTE BYPASS: Allowing access due to localhost auth bypass');
    return <>{children}</>;
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
