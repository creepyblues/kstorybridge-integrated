import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';

type AdminProfile = Tables<'admin'>;

interface AdminAuthContextType {
  user: User | null;
  adminProfile: AdminProfile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshAuth: () => Promise<void>;
  forceSignOut: () => Promise<void>;
  retryProfileLoad: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Check if we should auto-login for localhost development
  const shouldAutoLogin = () => {
    const isLocalhost = window.location.hostname === 'localhost';
    const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
    const isDev = import.meta.env.DEV;
    const mode = import.meta.env.MODE;
    
    // CRITICAL SECURITY: Multiple safety checks to ensure this NEVER runs in production
    const isProduction = mode === 'production' && window.location.hostname !== 'localhost';
    const hasProductionDomain = window.location.hostname.includes('kstorybridge.com');
    const isHttps = window.location.protocol === 'https:';
    const hasDevCredentials = import.meta.env.VITE_DEV_ADMIN_EMAIL && import.meta.env.VITE_DEV_ADMIN_PASSWORD;
    
    // Block if any production indicators are present
    if (isProduction || hasProductionDomain || (isHttps && !isLocalhost)) {
      console.log('🛡️ ADMIN PRODUCTION SAFETY: Auto-login blocked for production environment');
      console.log('🛡️ ADMIN PRODUCTION SAFETY: Environment checks:', {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        mode,
        isProduction,
        hasProductionDomain
      });
      return false;
    }
    
    // Only allow if ALL development conditions are met
    if (isLocalhost && bypassEnabled && isDev && hasDevCredentials) {
      console.log('🚨 ADMIN AUTO LOGIN: Auto-login enabled for localhost development');
      console.log('🚨 ADMIN AUTO LOGIN: This should NEVER happen in production!');
      console.log('🚨 ADMIN AUTO LOGIN: Environment checks:', {
        hostname: window.location.hostname,
        bypassEnabled,
        isDev,
        mode,
        hasCredentials: !!hasDevCredentials
      });
      return true;
    }
    
    if (isLocalhost && bypassEnabled && !hasDevCredentials) {
      console.warn('⚠️ ADMIN AUTO LOGIN: Auto-login requested but credentials not configured');
      console.warn('⚠️ ADMIN AUTO LOGIN: Set VITE_DEV_ADMIN_EMAIL and VITE_DEV_ADMIN_PASSWORD in .env.local');
    }
    
    return false;
  };

  // Auto-login with environment credentials for localhost development
  const performAutoLogin = async (): Promise<{ session: any; error: any }> => {
    const devEmail = import.meta.env.VITE_DEV_ADMIN_EMAIL;
    const devPassword = import.meta.env.VITE_DEV_ADMIN_PASSWORD;
    
    if (!devEmail || !devPassword) {
      console.error('❌ ADMIN AUTO LOGIN: Development credentials not configured');
      console.error('❌ ADMIN AUTO LOGIN: Set VITE_DEV_ADMIN_EMAIL and VITE_DEV_ADMIN_PASSWORD in .env.local');
      return { session: null, error: new Error('Development credentials not configured') };
    }
    
    console.log(`🔑 ADMIN AUTO LOGIN: Attempting auto-login for ${devEmail}`);
    
    try {
      // First check if already signed in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email === devEmail) {
        console.log(`✅ ADMIN AUTO LOGIN: Already signed in as ${devEmail}`);
        return { session, error: null };
      }

      // Sign in with environment credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: devEmail,
        password: devPassword
      });

      if (error) {
        console.error('❌ ADMIN AUTO LOGIN: Sign in failed:', error);
        return { session: null, error };
      }

      if (data.session) {
        console.log(`✅ ADMIN AUTO LOGIN: Successfully signed in as ${devEmail}`);
        return { session: data.session, error: null };
      }

      return { session: null, error: new Error('No session returned') };
    } catch (err) {
      console.error('❌ ADMIN AUTO LOGIN: Exception during auto-login:', err);
      return { session: null, error: err };
    }
  };

  const loadAdminProfile = async (email: string): Promise<void> => {
    try {
      console.log(`Admin Auth: Loading profile for ${email}`);
      
      // Create a timeout with AbortController for better control
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 10000); // Reduced timeout to 10 seconds for faster feedback

      try {
        const { data, error } = await supabase
          .from('admin')
          .select('*')
          .eq('email', email)
          .eq('active', true)
          .maybeSingle()
          .abortSignal(controller.signal);
        
        clearTimeout(timeoutId);

        if (error) {
          console.error('Admin Auth: Profile query error:', error);
          throw error;
        }

        if (data) {
          console.log('Admin Auth: Profile loaded successfully');
          setAdminProfile(data);
          clearError();
        } else {
          console.log('Admin Auth: No admin profile found');
          setError(`No admin access found for ${email}. Contact IT support.`);
          setAdminProfile(null);
        }
      } catch (innerError: any) {
        clearTimeout(timeoutId);
        if (innerError?.name === 'AbortError' || innerError?.message?.includes('aborted')) {
          throw new Error('Profile loading timeout');
        }
        throw innerError;
      }
    } catch (error) {
      console.error('Admin Auth: Profile loading failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Profile loading timeout') {
        console.log('Admin Auth: Timeout detected');
        setError('Profile loading timed out. Please check your connection and try again.');
        setAdminProfile(null);
      } else {
        setError(`Failed to load admin profile: ${errorMessage}`);
        setAdminProfile(null);
      }
    }
  };

  // Simple auth initialization and listener
  useEffect(() => {
    let mounted = true;

    console.log('Admin Auth: Initializing...');

    // Get initial session
    const initAuth = async () => {
      try {
        // Check if we should auto-login for localhost development
        if (shouldAutoLogin()) {
          console.log('🚨 ADMIN AUTO LOGIN: Attempting auto-login...');
          const { session, error: loginError } = await performAutoLogin();
          
          if (mounted) {
            if (session?.user) {
              setUser(session.user);
              setSession(session);
              console.log('✅ ADMIN AUTO LOGIN: Auto-login successful, loading admin profile...');
              
              // Load admin profile for the auto-logged user
              try {
                await loadAdminProfile(session.user.email);
              } catch (profileError) {
                console.error('❌ ADMIN AUTO LOGIN: Failed to load admin profile:', profileError);
              } finally {
                setIsLoading(false);
              }
              return;
            } else {
              console.log('❌ ADMIN AUTO LOGIN: Auto-login failed, proceeding with normal flow');
              setIsLoading(false);
              return;
            }
          }
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Admin Auth: Session error:', error);
          setError(`Session error: ${error.message}`);
          setIsLoading(false);
          return;
        }

        console.log('Admin Auth: Initial session:', session ? 'Found' : 'None');
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user?.email) {
          await loadAdminProfile(session.user.email);
        }
      } catch (error) {
        console.error('Admin Auth: Initialize error:', error);
        setError('Failed to initialize authentication');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log(`Admin Auth: ${event}`, session ? 'Session exists' : 'No session');
        
        setSession(session);
        setUser(session?.user ?? null);
        clearError();

        if (event === 'SIGNED_OUT') {
          setAdminProfile(null);
          setIsLoading(false);
        } else if (session?.user?.email) {
          setIsLoading(true);
          try {
            await loadAdminProfile(session.user.email);
          } finally {
            setIsLoading(false);
          }
        } else {
          setAdminProfile(null);
          setIsLoading(false);
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      setIsLoading(true);
      clearError();
      console.log('Admin Auth: Signing in...');

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('Admin Auth: Sign in failed:', error);
        setIsLoading(false);
        return { error };
      }

      console.log('Admin Auth: Sign in successful');
      return { error: null };
    } catch (error) {
      console.error('Admin Auth: Sign in exception:', error);
      setIsLoading(false);
      const err = error instanceof Error ? error : new Error('Sign in failed');
      return { error: err };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('Admin Auth: Signing out...');
      
      // Clear admin storage first to prevent session persistence issues
      try {
        const keys = Object.keys(localStorage);
        const adminKeys = keys.filter(key => key.startsWith('admin-'));
        adminKeys.forEach(key => localStorage.removeItem(key));
        console.log('Admin Auth: Cleared admin storage');
      } catch (storageError) {
        console.warn('Admin Auth: Failed to clear admin storage:', storageError);
      }
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Reset state
      setUser(null);
      setAdminProfile(null);
      setSession(null);
      clearError();
      
      console.log('Admin Auth: Sign out completed');
    } catch (error) {
      console.error('Admin Auth: Sign out error:', error);
    }
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      console.log('Admin Auth: Refreshing...');
      setIsLoading(true);
      clearError();

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.email) {
        await loadAdminProfile(session.user.email);
      } else {
        setAdminProfile(null);
      }
    } catch (error) {
      console.error('Admin Auth: Refresh failed:', error);
      setError('Failed to refresh authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const forceSignOut = async (): Promise<void> => {
    try {
      console.log('Admin Auth: Force signing out to clear stuck session...');
      
      // Clear all admin-related storage
      try {
        const keys = Object.keys(localStorage);
        const adminKeys = keys.filter(key => key.startsWith('admin-') || key.includes('dlrnrgcoguxlkkcitlpd'));
        adminKeys.forEach(key => localStorage.removeItem(key));
        console.log('Admin Auth: Force cleared all auth storage');
      } catch (storageError) {
        console.warn('Admin Auth: Failed to clear storage:', storageError);
      }
      
      // Reset state immediately
      setUser(null);
      setAdminProfile(null);
      setSession(null);
      setIsLoading(false);
      clearError();
      
      // Force sign out from Supabase
      await supabase.auth.signOut();
      
      console.log('Admin Auth: Force sign out completed');
    } catch (error) {
      console.error('Admin Auth: Force sign out error:', error);
    }
  };

  const retryProfileLoad = async (): Promise<void> => {
    if (user?.email) {
      console.log('Admin Auth: Retrying profile load...');
      setIsLoading(true);
      clearError();
      try {
        await loadAdminProfile(user.email);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const value = {
    user,
    adminProfile,
    session,
    isLoading,
    error,
    signIn,
    signOut,
    clearError,
    refreshAuth,
    forceSignOut,
    retryProfileLoad,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}