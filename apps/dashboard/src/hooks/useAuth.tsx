import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { setAnalyticsUser, clearAnalyticsUser } from '@/utils/analytics';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null,
  signOut: async () => {},
});

// 🚨 AUTH ISOLATION BOUNDARY
// This provider should ONLY manage authentication state
// Do NOT import business logic (tier, billing, features)

const AUTH_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Timeout wrapper for async operations
 * Fails fast with clear error message
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Get initial session with timeout protection
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_TIMEOUT_MS,
          'Session initialization'
        );

        if (sessionError) throw sessionError;

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          setError(null);

          // Set GA4 user ID for cross-session tracking
          if (session?.user) {
            setAnalyticsUser(session.user.id, { type: 'buyer' });
          }
        }
      } catch (err: any) {
        console.error('[AuthProvider] Initialization error:', err);
        if (mounted) {
          setLoading(false);
          setError(
            err.message?.includes('timed out')
              ? 'Connection timeout. Please check your network and try again.'
              : 'Authentication failed. Please refresh and try again.'
          );
        }
      }
    };

    initializeAuth();

    // Listen for auth changes (single listener)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setError(null); // Clear errors on successful auth change

        // Update GA4 user tracking on auth state change
        if (session?.user) {
          setAnalyticsUser(session.user.id, { type: 'buyer' });
        } else {
          clearAnalyticsUser();
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      clearAnalyticsUser(); // Clear GA4 user before sign out
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
