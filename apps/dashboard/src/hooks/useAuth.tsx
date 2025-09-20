import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { sendWelcomeEmail } from "@/services/emailService";
import { initializeSessionFromUrl, getCurrentSession, performSessionHealthCheck } from "@/utils/sessionManager";
import { setDirectApiAccessToken } from "@/services/directApiService";
import { pageReloadOptimizer } from "@/utils/pageReloadOptimizer";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  isSessionHealthy: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionHealthy, setIsSessionHealthy] = useState(true);

  const handleWelcomeEmailForNewUser = async (user: User) => {
    try {
      const accountType = user.user_metadata?.account_type || 'buyer';

      if (accountType === 'creator') {
        // Handle creator welcome email
        const { data: creatorProfile, error: creatorError } = await supabase
          .from('user_creators')
          .select('email, full_name, pen_name')
          .eq('id', user.id)
          .maybeSingle();

        if (creatorError) {
          console.warn('⚠️ Skipping creator welcome email – unable to read profile:', creatorError.message);
          return;
        }

        if (!creatorProfile) {
          return; // No creator profile found
        }

        // Send welcome email for creator
        await sendWelcomeEmail({
          userName: creatorProfile.full_name,
          userEmail: user.email!,
          accountType: 'creator',
          dashboardUrl: window.location.origin + '/creators/home/',
          loginUrl: window.location.origin + '/signin'
        });

        console.log('✅ Welcome email sent for verified creator:', user.email);

      } else {
        // Handle buyer welcome email
        const { data: buyerProfile, error: buyerError } = await supabase
          .from('user_buyers')
          .select('email, full_name, tier')
          .eq('id', user.id)
          .maybeSingle();

        if (buyerError) {
          console.warn('⚠️ Skipping buyer welcome email – unable to read profile:', buyerError.message);
          return;
        }

        if (!buyerProfile) {
          return; // No buyer profile found
        }

        // Send welcome email for buyer
        await sendWelcomeEmail({
          userName: buyerProfile.full_name,
          userEmail: user.email!,
          accountType: 'buyer',
          dashboardUrl: window.location.origin + '/buyers/home',
          loginUrl: window.location.origin + '/signin'
        });

        console.log('✅ Welcome email sent for verified buyer:', user.email);
      }

    } catch (error) {
      console.error('⚠️ Failed to send welcome email for verified user:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 AUTH: Initializing authentication with robust session management...');
        
        // Check for URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const hasAccessToken = urlParams.has('access_token');
        
        if (hasAccessToken) {
          console.log('🔗 AUTH: Found access token in URL, attempting secure session initialization...');
          
          const urlSessionResult = await initializeSessionFromUrl();
          
          if (!mounted) return;
          
          if (urlSessionResult.success && urlSessionResult.session) {
            console.log('✅ AUTH: Successfully initialized session from URL');
            setSession(urlSessionResult.session);
            setUser(urlSessionResult.session.user);
            
            // Perform health check on new session
            const healthCheck = await performSessionHealthCheck();
            if (!healthCheck.healthy) {
              console.warn('⚠️ AUTH: New session failed health check:', healthCheck.issues);
            }
          } else {
            console.error('❌ AUTH: Failed to initialize session from URL:', urlSessionResult.error);
            
            // Clear URL if recommended
            if (urlSessionResult.shouldClearUrl) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        } else {
          console.log('🔍 AUTH: No URL tokens, checking for existing session...');
          
          // Use robust session getter with automatic refresh
          const session = await getCurrentSession();
          
          if (!mounted) return;
          
          if (session?.user) {
            console.log('✅ AUTH: Found valid existing session for user:', session.user.email);
            
            // Set session immediately for faster page loads
            setSession(session);
            setUser(session.user);
            
            // Perform health check based on reload optimization
            const reloadStrategy = pageReloadOptimizer.getOptimalStrategy();
            const healthCheckDelay = reloadStrategy.useAsyncOperations ? 2000 : 500; // Longer delay on reload
            
            if (reloadStrategy.skipHealthChecks) {
              pageReloadOptimizer.logOptimization('Auth', 'Skipping immediate health check for page reload');
              setIsSessionHealthy(true); // Assume healthy on reload
            } else {
              // Perform health check asynchronously (don't block UI)
              setTimeout(async () => {
                try {
                  const healthCheck = await performSessionHealthCheck();
                console.log('🏥 AUTH: Async session health check result:', {
                  healthy: healthCheck.healthy,
                  issues: healthCheck.issues,
                  recommendations: healthCheck.recommendations
                });
                
                setIsSessionHealthy(healthCheck.healthy);
                
                // Update session if health check provided a refreshed one
                if (healthCheck.session && healthCheck.session !== session) {
                  console.log('🔄 AUTH: Updating session from health check');
                  setSession(healthCheck.session);
                  setUser(healthCheck.session.user);
                }
                } catch (error) {
                  console.warn('⚠️ AUTH: Async health check failed:', error);
                  // Don't fail the auth flow for health check issues
                }
              }, healthCheckDelay);
            }
          } else {
            console.log('ℹ️ AUTH: No existing session found');
            setSession(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ AUTH: Critical error during authentication initialization:', error);
        
        // In case of critical error, clear state and continue
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('🏁 AUTH: Authentication initialization complete');
        }
      }
    };

    initializeAuth();

    // Set up enhanced auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 AUTH: Auth state change event:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Perform health check on session changes
        if (session?.user) {
          const healthCheck = await performSessionHealthCheck();
          setIsSessionHealthy(healthCheck.healthy);
          
          if (!healthCheck.healthy) {
            console.warn('⚠️ AUTH: Session health issues detected:', {
              issues: healthCheck.issues,
              recommendations: healthCheck.recommendations
            });
          }
        } else {
          setIsSessionHealthy(true); // No session means no health issues
        }

        // Send welcome email for new verified users
        if (event === 'SIGNED_IN' && session?.user) {
          await handleWelcomeEmailForNewUser(session.user);
        }

        // Handle token refresh events
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('✅ AUTH: Token refreshed successfully for user:', session.user.email);
        }
      }
    );

    // Set up periodic session health monitoring
    const healthCheckInterval = setInterval(async () => {
      if (!mounted) return;
      
      const healthCheck = await performSessionHealthCheck();
      setIsSessionHealthy(healthCheck.healthy);
      
      if (!healthCheck.healthy && healthCheck.session) {
        console.log('🏥 AUTH: Periodic health check found issues, updating session state');
        setSession(healthCheck.session);
        setUser(healthCheck.session.user);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(healthCheckInterval);
    };
  }, []);

  const refreshSession = async (): Promise<boolean> => {
    try {
      console.log('🔄 AUTH: Manual session refresh requested');
      
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ AUTH: Manual session refresh failed:', error.message);
        return false;
      }

      if (session?.user) {
        console.log('✅ AUTH: Manual session refresh successful');
        setSession(session);
        setUser(session.user);
        setIsSessionHealthy(true);
        return true;
      }

      console.warn('⚠️ AUTH: Manual session refresh returned no session');
      return false;
    } catch (error) {
      console.error('❌ AUTH: Exception during manual session refresh:', error);
      return false;
    }
  };

  useEffect(() => {
    setDirectApiAccessToken(session?.access_token ?? null);
  }, [session]);

  const signOut = () => {
    console.group('🚪 AUTH SIGN OUT');

    const accountType = user?.user_metadata?.account_type;
    const defaultRedirect = '/signin?signed_out=true';
    const redirectForAccount = accountType === 'creator'
      ? '/signin/creator?signed_out=true'
      : accountType === 'buyer'
        ? '/signin/buyer?signed_out=true'
        : defaultRedirect;

    console.log('User context before sign out:', {
      id: user?.id,
      email: user?.email,
      accountType,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
      redirectTarget: redirectForAccount,
    });

    const SIGN_OUT_TIMEOUT_MS = 5000; // Reduced timeout for faster feedback
    let finalized = false;
    let resolver: (() => void) | null = null;

    const completion = new Promise<void>((resolve) => {
      resolver = resolve;
    });

    const finalize = (reason: 'success' | 'error' | 'exception' | 'timeout', details?: unknown) => {
      if (finalized) {
        console.log('Sign out finalize already executed – skipping duplicate call.', { reason, details });
        return;
      }
      finalized = true;

      console.log('🔚 Finalizing sign out', { reason, details, redirectForAccount });

      try {
        // Clear auth tokens (might be redundant with immediate cleanup, but ensures cleanup)
        localStorage.removeItem('sb-dlrnrgcoguxlkkcitlpd-auth-token');
        sessionStorage.removeItem('supabase.auth.token');
      } catch (storageError) {
        console.warn('Unable to clear cached auth tokens:', storageError);
      }

      setUser(null);
      setSession(null);
      setIsSessionHealthy(true);
      setDirectApiAccessToken(null);

      resolver?.();

      if (typeof window !== 'undefined') {
        const destination = reason === 'success'
          ? redirectForAccount
          : '/signin?signed_out=true&error=signout_failed';
        console.log('Redirecting browser to:', destination);
        window.location.href = destination;
      }

      console.groupEnd();
    };

    const timeoutId = setTimeout(() => {
      console.warn(`⏰ Supabase signOut timeout after ${SIGN_OUT_TIMEOUT_MS}ms - proceeding with forced cleanup`);
      finalize('timeout');
    }, SIGN_OUT_TIMEOUT_MS);

    console.log('🔄 Starting Supabase signOut...');
    const startTime = Date.now();

    // Start the Supabase signOut call, but don't rely on it completing
    const signOutPromise = supabase.auth
      .signOut()
      .then((result) => {
        const duration = Date.now() - startTime;
        console.log(`⏱️ Supabase signOut completed in ${duration}ms`);
        clearTimeout(timeoutId);
        if (result?.error) {
          console.error('❌ Supabase signOut returned error:', result.error);
          // Even with errors, treat as success since we're cleaning up locally anyway
          finalize('success');
        } else {
          console.log('✅ Supabase signOut resolved without error');
          finalize('success');
        }
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        console.error(`❌ Supabase signOut threw exception after ${duration}ms:`, error);
        clearTimeout(timeoutId);
        // Even with exceptions, treat as success since we're cleaning up locally anyway
        finalize('success');
      });

    // For immediate local cleanup without waiting for Supabase
    // This ensures the user gets logged out quickly regardless of network issues
    try {
      // Clear tokens immediately
      localStorage.removeItem('sb-dlrnrgcoguxlkkcitlpd-auth-token');
      sessionStorage.removeItem('supabase.auth.token');

      // Clear any other auth-related storage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });

      console.log('🧹 Local auth cleanup completed immediately');

      // Force finalize after a brief delay if Supabase hasn't responded
      // This ensures users don't wait too long for sign out
      setTimeout(() => {
        if (!finalized) {
          console.log('🚀 Force finalizing sign out after 2 seconds');
          clearTimeout(timeoutId);
          finalize('success'); // Treat as success since we cleared everything locally
        }
      }, 2000);

    } catch (cleanupError) {
      console.warn('⚠️ Local cleanup had issues:', cleanupError);
    }

    return completion;
  };

  const authContextValue = {
    user,
    session,
    loading,
    signOut: async () => {
      try {
        return await signOut();
      } catch (error) {
        console.error('Unhandled signOut catch:', error);
        throw error;
      }
    },
    refreshSession,
    isSessionHealthy,
  } satisfies AuthContextType;

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
