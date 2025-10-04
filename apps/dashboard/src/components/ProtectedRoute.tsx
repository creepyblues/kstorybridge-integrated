
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { performSessionHealthCheck } from "@/utils/sessionManager";
import { Loader2 } from "lucide-react";
import { SESSION_CONFIG } from "@/config/sessionConfig";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, session, signOut } = useAuth();
  const authTimeoutRef = useRef<NodeJS.Timeout>();
  const sessionCheckRef = useRef<boolean>(false);

  // Navigation-time session validation (user requested: only check during navigation, not on page return)
  useEffect(() => {
    const validateSessionOnNavigation = async () => {
      // Only validate if we have a user and session, and haven't checked recently
      if (user && session && !sessionCheckRef.current && !loading) {
        console.log('🔍 PROTECTED ROUTE: Performing navigation-time session validation...');
        sessionCheckRef.current = true;

        try {
          const healthCheck = await performSessionHealthCheck();

          if (!healthCheck.healthy) {
            console.warn('⚠️ PROTECTED ROUTE: Session health check failed:', healthCheck.issues);

            // Check if issues indicate session expiry or authentication problems
            const hasAuthIssues = healthCheck.issues.some(issue =>
              issue.includes('expired') ||
              issue.includes('invalid') ||
              issue.includes('JWT') ||
              issue.includes('unauthorized')
            );

            if (hasAuthIssues) {
              console.log('🔐 PROTECTED ROUTE: Session expired/invalid, redirecting to login');
              await signOut();
              return;
            }
          } else {
            console.log('✅ PROTECTED ROUTE: Session is healthy');
          }
        } catch (error) {
          console.error('❌ PROTECTED ROUTE: Session health check failed:', error);
          // Don't sign out on health check errors - might be temporary network issues
        }

        // Reset check flag to allow re-checking on subsequent navigations
        setTimeout(() => {
          sessionCheckRef.current = false;
        }, SESSION_CONFIG.PROTECTED_ROUTE_THROTTLE);
      }
    };

    validateSessionOnNavigation();
  }, [user, session, loading, signOut]);

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
    
    // Check for recent OAuth completion (session might not be loaded yet)
    const recentOAuthCompletion = sessionStorage.getItem('oauth_completion_pending') === 'true';
    
    // Don't redirect if auth is still loading OR if we have auth tokens in URL OR recent OAuth
    if (!loading && !user && !hasAuthTokens && !recentOAuthCompletion) {
      console.log('🚨 PROTECTED ROUTE: Redirecting to dashboard signin - no user authenticated and no auth flow in progress');
      console.log('🚨 PROTECTED ROUTE: Current URL:', window.location.href);
      
      // Small delay to prevent rapid redirects
      setTimeout(() => {
        console.log('🚨 PROTECTED ROUTE: Executing redirect to dashboard signin');
        window.location.href = '/signin';
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
          console.log('🚨 PROTECTED ROUTE: Timeout reached, redirecting to dashboard signin');
          window.location.href = '/signin';
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
