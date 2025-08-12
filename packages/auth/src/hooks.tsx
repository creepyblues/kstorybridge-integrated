import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { AuthService, UserProfile, AuthUser } from './authService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isRedirecting: boolean;
  signOut: () => Promise<void>;
  authService: AuthService;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  authService: AuthService;
  websiteUrl?: string;
  dashboardUrl?: string;
  enableLocalBypass?: boolean;
}

export function AuthProvider({ 
  children, 
  authService, 
  websiteUrl, 
  dashboardUrl,
  enableLocalBypass = false 
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check if we should bypass auth for localhost development
  const shouldBypassAuth = () => {
    if (!enableLocalBypass || typeof window === 'undefined') return false;
    const isLocalhost = window.location.hostname === 'localhost';
    const bypassEnabled = import.meta?.env?.VITE_DISABLE_AUTH_LOCALHOST === 'true';
    const isDev = import.meta?.env?.DEV;
    
    return isLocalhost && bypassEnabled && isDev;
  };

  // Create mock user for localhost development
  const createMockUser = (): User => {
    return {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@localhost.com',
      app_metadata: {},
      user_metadata: { 
        account_type: 'buyer',
        full_name: 'Test User (Local Dev)'
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      role: 'authenticated',
      confirmation_sent_at: new Date().toISOString(),
    } as User;
  };

  // Create mock session for localhost development
  const createMockSession = (mockUser: User): Session => {
    return {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: mockUser,
    } as Session;
  };

  // Create mock profile
  const createMockProfile = (): UserProfile => {
    return {
      account_type: 'buyer',
      invitation_status: 'accepted',
      role: 'media_buyer'
    };
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 AUTH: Initializing shared auth...');
        
        // Check if we should bypass auth for localhost development
        if (shouldBypassAuth()) {
          const mockUser = createMockUser();
          const mockSession = createMockSession(mockUser);
          const mockProfile = createMockProfile();
          
          if (mounted) {
            setUser(mockUser);
            setSession(mockSession);
            setUserProfile(mockProfile);
            setLoading(false);
          }
          return;
        }

        // Check for session parameters in URL (for cross-domain auth)
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('access_token')) {
          console.log('🔗 AUTH: Found access token in URL, setting session...');
          const session = await authService.setSessionFromUrl(urlParams);
          
          if (!mounted) return;
          
          if (session?.user) {
            console.log('✅ AUTH: Successfully set session from URL');
            setSession(session);
            setUser(session.user);
            
            // Fetch user profile
            const profile = await authService.fetchUserProfile(session.user);
            if (profile) {
              setUserProfile(profile);
            }
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            console.error('❌ AUTH: Failed to set session from URL');
          }
        } else {
          console.log('🔍 AUTH: Checking for existing session...');
          // Check for existing session
          const session = await authService.getSession();
          
          if (!mounted) return;
          
          if (session?.user) {
            setSession(session);
            setUser(session.user);
            
            // Fetch user profile
            const profile = await authService.fetchUserProfile(session.user);
            if (profile) {
              setUserProfile(profile);
            }
          }
        }
      } catch (error) {
        console.error('❌ AUTH: Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('🏁 AUTH: Auth initialization complete');
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [authService]);

  const signOut = async () => {
    console.log('🚪 AUTH: Starting sign out process');
    
    if (websiteUrl) {
      const signOutUrl = `${websiteUrl}${websiteUrl.includes('?') ? '&' : '?'}signed_out=true`;
      console.log('🚪 AUTH: Redirecting to:', signOutUrl);
      window.location.href = signOutUrl;
      
      // Sign out after redirect is initiated
      setTimeout(async () => {
        await authService.signOut();
      }, 100);
    } else {
      await authService.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setIsRedirecting(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      userProfile, 
      loading, 
      isRedirecting,
      signOut, 
      authService 
    }}>
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