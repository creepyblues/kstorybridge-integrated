/**
 * Enhanced Dashboard Entrypoint with Robust Authentication Handling
 * 
 * This component serves as the main entry point for authenticated users,
 * providing robust session validation, account type detection, and proper
 * error recovery mechanisms to prevent infinite loading states.
 */

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccountType, getDashboardPath } from "@/hooks/useAccountType";
import { supabase, performSupabaseHealthCheck } from "@/integrations/supabase/client";
import { performSessionHealthCheck, recoverCorruptedSession } from "@/utils/sessionManager";

export function DashboardEntrypoint() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [systemHealthy, setSystemHealthy] = useState<boolean | null>(null);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [timeoutTriggered, setTimeoutTriggered] = useState(false);

  // Check if this is an OAuth signin or recent OAuth session
  const urlParams = new URLSearchParams(window.location.search);
  const isOAuthCallback = urlParams.has('code');

  // Check if this is a fresh OAuth session (within 30 seconds)
  const isFreshOAuthSession = useMemo(() => {
    if (isOAuthCallback) return true;

    // Check if session is very recent (likely from OAuth)
    if (user?.user_metadata?.account_type) {
      const sessionAge = Date.now() - (user.created_at ? new Date(user.created_at).getTime() : 0);
      return sessionAge < 30000; // 30 seconds
    }

    return false;
  }, [isOAuthCallback, user]);

  // Use streamlined metadata-first account type detection
  const {
    accountType,
    loading: accountTypeLoading,
    source: accountTypeSource,
    confidence
  } = useAccountType({
    user,
    debug: true
  });

  // Simplified health check to avoid circular dependency
  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        console.log('🏥 DashboardEntrypoint: Performing simplified system health check');

        // Only check Supabase health, skip session health check to avoid circular dependency
        const supabaseHealth = await performSupabaseHealthCheck();

        console.log('🏥 DashboardEntrypoint: System health check results:', {
          supabase: supabaseHealth.healthy,
          overall: supabaseHealth.healthy
        });

        setSystemHealthy(supabaseHealth.healthy);
      } catch (error) {
        console.error('❌ DashboardEntrypoint: System health check failed:', error);
        setSystemHealthy(false);
      }
    };

    checkSystemHealth();
  }, []);

  // Enhanced timeout mechanism with multiple layers
  useEffect(() => {
    if (hasRedirected || timeoutTriggered) return;

    const timeouts: NodeJS.Timeout[] = [];
    
    // Layer 1: Warning timeout (3 seconds)
    timeouts.push(setTimeout(() => {
      if ((authLoading || accountTypeLoading) && !hasRedirected) {
        console.warn('⚠️ DashboardEntrypoint: Authentication taking longer than expected');
      }
    }, 3000));
    
    // Layer 2: Recovery timeout (8 seconds)
    timeouts.push(setTimeout(async () => {
      if ((authLoading || accountTypeLoading) && !hasRedirected && !recoveryAttempted) {
        console.warn('🔧 DashboardEntrypoint: Initiating recovery due to prolonged loading');
        
        try {
          const recovery = await recoverCorruptedSession();
          if (recovery.recovered) {
            setRecoveryAttempted(true);
            return; // Give recovery a chance to work
          }
        } catch (error) {
          console.error('❌ DashboardEntrypoint: Recovery failed:', error);
        }
      }
    }, 8000));
    
    // Layer 3: Emergency timeout (15 seconds)
    timeouts.push(setTimeout(async () => {
      if ((authLoading || accountTypeLoading) && !hasRedirected) {
        console.error('🚨 DashboardEntrypoint: Emergency timeout - forcing recovery');
        setTimeoutTriggered(true);
        
        try {
          // Comprehensive cleanup
          await recoverCorruptedSession();
          
          // Force signout
          await signOut();
        } catch (error) {
          console.error('❌ DashboardEntrypoint: Emergency recovery failed:', error);
          
          // Nuclear option - clear everything and reload
          localStorage.clear();
          sessionStorage.clear();
          window.location.replace('/signin?emergency_recovery=true');
        }
      }
    }, 15000));

    return () => timeouts.forEach(clearTimeout);
  }, [authLoading, accountTypeLoading, hasRedirected, recoveryAttempted, timeoutTriggered, signOut]);

  // Main redirection logic
  useEffect(() => {
    const handleRedirection = async () => {
      // Prevent multiple redirects
      if (hasRedirected || timeoutTriggered) return;
      
      // Wait for system health check to complete
      if (systemHealthy === null) {
        console.log('⏳ DashboardEntrypoint: Waiting for system health check...');
        return;
      }

      console.log('🏠 DashboardEntrypoint: Processing redirection', {
        user: user?.email,
        authLoading,
        accountTypeLoading,
        accountType,
        systemHealthy,
        recoveryAttempted,
        currentUrl: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        isFreshOAuth: isFreshOAuthSession,
        isOAuthCallback,
        shouldNotBeHere: window.location.pathname.includes('/signup')
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

      // If user exists but still loading account type, wait (but not too long)
      if (accountTypeLoading) {
        console.log('🔄 DashboardEntrypoint: Waiting for account type detection...');
        return;
      }

      // Check account type result
      if (!accountType) {
        console.error('❌ DashboardEntrypoint: No valid account type detected', {
          confidence,
          source: accountTypeSource,
          hasUser: !!user
        });
        setHasRedirected(true);

        // For OAuth callbacks, redirect to signin instead of account type selection (which was removed)
        if (isOAuthCallback) {
          console.log('🔄 DashboardEntrypoint: OAuth callback without account type, redirecting to signin');
          navigate('/signin?oauth_entrypoint=true');
          return;
        }

        // If we haven't attempted recovery yet, try it
        if (!recoveryAttempted) {
          console.log('🔧 DashboardEntrypoint: Attempting recovery for missing account type');
          try {
            const recovery = await recoverCorruptedSession();
            if (recovery.recovered) {
              setRecoveryAttempted(true);
              return; // Let the system retry
            }
          } catch (error) {
            console.error('❌ DashboardEntrypoint: Recovery failed:', error);
          }
        }

        // Force signout after failed recovery
        try {
          await signOut();
        } catch (error) {
          console.error('❌ DashboardEntrypoint: Signout failed:', error);
          window.location.replace('/signin?account_type_error=true');
        }
        return;
      }

      // Valid account type found - redirect to appropriate dashboard
      const dashboardPath = getDashboardPath(accountType);
      console.log('✅ DashboardEntrypoint: Redirecting to dashboard:', {
        accountType,
        path: dashboardPath,
        source: accountTypeSource
      });

      setHasRedirected(true);
      navigate(dashboardPath, { replace: true });
    };

    handleRedirection();
  }, [
    user,
    authLoading,
    accountTypeLoading,
    accountType,
    confidence,
    accountTypeSource,
    navigate,
    hasRedirected,
    timeoutTriggered,
    systemHealthy,
    recoveryAttempted,
    signOut,
    isOAuthCallback
  ]);

  // Enhanced loading state with better UX
  const getLoadingMessage = () => {
    if (timeoutTriggered) return 'Recovering from error...';
    if (systemHealthy === false) return 'System issues detected, attempting recovery...';
    if (recoveryAttempted) return 'Recovery completed, reloading...';
    if (authLoading) return 'Verifying your session...';
    if (accountTypeLoading) return 'Loading your dashboard...';
    return 'Preparing your account...';
  };

  const getLoadingSubtext = () => {
    if (timeoutTriggered) return 'This may take a few moments';
    if (systemHealthy === false) return 'We detected some issues and are fixing them';
    if (recoveryAttempted) return 'Your session has been refreshed';
    return 'This should only take a moment';
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal mx-auto mb-6"></div>
        
        <h2 className="text-xl font-semibold text-white mb-2">
          {getLoadingMessage()}
        </h2>
        
        <p className="text-slate-300 text-sm mb-6">
          {getLoadingSubtext()}
        </p>
        
        {/* System status indicator */}
        {systemHealthy === false && (
          <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
            <p className="text-amber-200 text-xs">
              🔧 System maintenance in progress
            </p>
          </div>
        )}
        
        {timeoutTriggered && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
            <p className="text-red-200 text-xs">
              ⚠️ Extended loading detected - applying fixes
            </p>
          </div>
        )}
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-slate-800/50 border border-slate-700 rounded text-xs text-slate-400 text-left">
            <div>Auth Loading: {authLoading ? 'Yes' : 'No'}</div>
            <div>Account Type Loading: {accountTypeLoading ? 'Yes' : 'No'}</div>
            <div>Account Type: {accountType || 'None'}</div>
            <div>System Healthy: {systemHealthy === null ? 'Checking' : systemHealthy ? 'Yes' : 'No'}</div>
            <div>Recovery Attempted: {recoveryAttempted ? 'Yes' : 'No'}</div>
            <div>Has User: {user ? 'Yes' : 'No'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
