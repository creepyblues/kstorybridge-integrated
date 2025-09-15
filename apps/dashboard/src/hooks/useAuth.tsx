import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { sendWelcomeEmail } from "@/services/emailService";
import { initializeSessionFromUrl, getCurrentSession, performSessionHealthCheck } from "@/utils/sessionManager";
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
      // Check if we've already sent a welcome email (using localStorage to track)
      const welcomeEmailKey = `welcome_email_sent_${user.id}`;
      if (localStorage.getItem(welcomeEmailKey)) {
        return; // Already sent welcome email
      }

      const accountType = user.user_metadata?.account_type || 'buyer';

      if (accountType === 'creator') {
        // Handle creator welcome email
        const { data: creatorProfile } = await supabase
          .from('user_creators')
          .select('email, full_name, pen_name')
          .eq('email', user.email?.toLowerCase())
          .maybeSingle();

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
        const { data: buyerProfile } = await supabase
          .from('user_buyers')
          .select('email, full_name, tier')
          .eq('email', user.email?.toLowerCase())
          .maybeSingle();

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

      // Mark as sent to avoid duplicate emails
      localStorage.setItem(welcomeEmailKey, 'true');

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

  const signOut = async () => {
    console.log('🚪 DASHBOARD: Starting sign out process');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Redirect to dashboard signin page with signed_out parameter
    const signOutUrl = `/signin?signed_out=true`;
    console.log('🚪 DASHBOARD: Sign out - redirecting to:', signOutUrl);
    console.log('🚪 DASHBOARD: Sign out - current location:', window.location.href);
    
    window.location.href = signOutUrl;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, refreshSession, isSessionHealthy }}>
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