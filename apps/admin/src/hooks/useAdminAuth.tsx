import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';
import { clearAdminStorage, debugAdminStorage } from '@/lib/adminStorage';

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
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to prevent stale closures
  const isLoadingRef = useRef(isLoading);
  const userRef = useRef(user);
  const sessionRef = useRef(session);
  
  // Update refs when state changes
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Clear error function
  const clearError = () => setError(null);

  // Enhanced session monitoring
  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;
    let sessionCheckInterval: NodeJS.Timeout;

    console.log('🔐 Admin Auth: Initializing authentication...');

    // Set loading timeout (reduced to 6 seconds)
    loadingTimeout = setTimeout(() => {
      if (mounted && isLoadingRef.current) {
        console.log('⏰ Admin Auth: Loading timeout reached');
        setIsLoading(false);
        setError('Authentication timeout. Please try refreshing the page.');
      }
    }, 6000);

    // Initialize session
    const initializeAuth = async () => {
      try {
        console.log('🔍 Admin Auth: Getting initial session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          console.error('❌ Admin Auth: Session error:', sessionError);
          setError(`Session error: ${sessionError.message}`);
          setIsLoading(false);
          return;
        }

        console.log('📋 Admin Auth: Initial session:', session ? 'Found' : 'None');
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadAdminProfile(session.user.email!);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Admin Auth: Initialize error:', error);
        setError('Failed to initialize authentication');
        setIsLoading(false);
      }
    };

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log(`🔄 Admin Auth: State change - ${event}`, session ? 'Session exists' : 'No session');
        
        setSession(session);
        setUser(session?.user ?? null);
        clearError(); // Clear any previous errors

        if (event === 'SIGNED_OUT') {
          setAdminProfile(null);
          setIsLoading(false);
          console.log('👋 Admin Auth: User signed out');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Admin Auth: Token refreshed');
          if (session?.user) {
            await loadAdminProfile(session.user.email!);
          }
        } else if (session?.user) {
          await loadAdminProfile(session.user.email!);
        } else {
          setAdminProfile(null);
          setIsLoading(false);
        }
      }
    );

    // Periodic session health check
    sessionCheckInterval = setInterval(async () => {
      if (!mounted || !sessionRef.current) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && sessionRef.current) {
          console.log('⚠️ Admin Auth: Session expired during health check');
          setSession(null);
          setUser(null);
          setAdminProfile(null);
          setError('Session expired. Please log in again.');
        }
      } catch (error) {
        console.error('❌ Admin Auth: Health check error:', error);
      }
    }, 30000); // Check every 30 seconds

    // Start initialization
    initializeAuth();

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      clearInterval(sessionCheckInterval);
      subscription.unsubscribe();
      console.log('🧹 Admin Auth: Cleanup completed');
    };
  }, []);

  const loadAdminProfile = async (email: string): Promise<void> => {
    try {
      console.log(`👤 Admin Auth: Loading profile for ${email}...`);
      
      // Multiple query strategies with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        // Try the standard query first
        const { data, error } = await supabase
          .from('admin')
          .select('*')
          .eq('email', email)
          .eq('active', true)
          .maybeSingle(); // Use maybeSingle to avoid errors when no record found

        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Admin Auth: Profile query error:', error);
          throw error;
        }

        if (data) {
          console.log('✅ Admin Auth: Profile loaded successfully');
          setAdminProfile(data);
        } else {
          console.log('❌ Admin Auth: No admin profile found for:', email);
          setError(`No admin access found for ${email}. Contact IT support.`);
          setAdminProfile(null);
        }
      } catch (queryError) {
        clearTimeout(timeoutId);
        
        if (queryError.name === 'AbortError') {
          throw new Error('Profile loading timeout');
        }
        throw queryError;
      }
    } catch (error) {
      console.error('❌ Admin Auth: Profile loading failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to load admin profile: ${errorMessage}`);
      setAdminProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      setIsLoading(true);
      clearError();
      console.log(`🔐 Admin Auth: Signing in ${email}...`);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('❌ Admin Auth: Sign in failed:', error);
        setIsLoading(false);
        return { error };
      }

      console.log('✅ Admin Auth: Sign in successful');
      // Auth state change listener will handle the rest
      return { error: null };
    } catch (error) {
      console.error('❌ Admin Auth: Sign in exception:', error);
      setIsLoading(false);
      const err = error instanceof Error ? error : new Error('Sign in failed');
      return { error: err };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('🚪 Admin Auth: Signing out...');
      
      // Clear admin storage first
      clearAdminStorage();
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      
      // Reset state
      setUser(null);
      setAdminProfile(null);
      setSession(null);
      clearError();
      
      console.log('✅ Admin Auth: Sign out completed');
    } catch (error) {
      console.error('❌ Admin Auth: Sign out error:', error);
    }
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      console.log('🔄 Admin Auth: Refreshing authentication...');
      setIsLoading(true);
      clearError();

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadAdminProfile(session.user.email!);
      } else {
        setAdminProfile(null);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Admin Auth: Refresh failed:', error);
      setError('Failed to refresh authentication');
      setIsLoading(false);
    }
  };

  // Debug helper (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).adminAuth = {
        user,
        adminProfile,
        session,
        isLoading,
        error,
        refreshAuth,
        clearError,
        debugStorage: debugAdminStorage,
        clearStorage: clearAdminStorage,
      };
    }
  }, [user, adminProfile, session, isLoading, error]);

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