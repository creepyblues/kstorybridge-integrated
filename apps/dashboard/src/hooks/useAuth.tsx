import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getWebsiteUrl } from "@/config/urls";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if we should bypass auth for localhost development
  const shouldBypassAuth = () => {
    const isLocalhost = window.location.hostname === 'localhost';
    const isDev = import.meta.env.DEV;
    
    if (isLocalhost && isDev) {
      console.log('🚨 AUTH BYPASS: Authentication bypassed for localhost development');
      console.log('🚨 AUTH BYPASS: This should NEVER happen in production!');
      console.log('🚨 AUTH BYPASS: Loading test data for sungho@dadble.com');
      return true;
    }
    return false;
  };

  // Create mock user for localhost development using real user account
  const createMockUser = async (): Promise<User> => {
    // Try to find an existing user with this email to get real user data
    try {
      console.log('🔍 AUTH BYPASS: Attempting to find existing user data for sungho@dadble.com');
      
      // First check the main profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'sungho@dadble.com')
        .single();
      
      if (profile) {
        console.log('✅ AUTH BYPASS: Found existing profile, using real user ID:', profile.id);
        return {
          id: profile.id,
          email: 'sungho@dadble.com',
          app_metadata: {},
          user_metadata: { 
            account_type: profile.account_type,
            full_name: profile.full_name,
            buyer_company: profile.buyer_company,
            buyer_role: profile.buyer_role,
            ip_owner_company: profile.ip_owner_company,
            ip_owner_role: profile.ip_owner_role,
            pen_name: profile.pen_name,
            linkedin_url: profile.linkedin_url,
            website_url: profile.website_url
          },
          aud: 'authenticated',
          created_at: profile.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          role: 'authenticated',
          confirmation_sent_at: new Date().toISOString(),
        } as User;
      }

      // Fallback: Check if there's a buyer profile with this email
      const { data: buyerProfile } = await supabase
        .from('user_buyers')
        .select('*')
        .eq('email', 'sungho@dadble.com')
        .single();
      
      if (buyerProfile) {
        console.log('✅ AUTH BYPASS: Found existing buyer profile, using real user ID:', buyerProfile.id);
        return {
          id: buyerProfile.id,
          email: 'sungho@dadble.com',
          app_metadata: {},
          user_metadata: { 
            account_type: 'buyer',
            full_name: buyerProfile.full_name,
            buyer_company: buyerProfile.buyer_company,
            buyer_role: buyerProfile.buyer_role,
            linkedin_url: buyerProfile.linkedin_url
          },
          aud: 'authenticated',
          created_at: buyerProfile.created_at || new Date().toISOString(),
          updated_at: buyerProfile.updated_at || new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          role: 'authenticated',
          confirmation_sent_at: new Date().toISOString(),
        } as User;
      }

      // Fallback: Check if there's an IP owner profile with this email
      const { data: ipOwnerProfile } = await supabase
        .from('user_ipowners')
        .select('*')
        .eq('email', 'sungho@dadble.com')
        .single();
      
      if (ipOwnerProfile) {
        console.log('✅ AUTH BYPASS: Found existing IP owner profile, using real user ID:', ipOwnerProfile.id);
        return {
          id: ipOwnerProfile.id,
          email: 'sungho@dadble.com',
          app_metadata: {},
          user_metadata: { 
            account_type: 'ip_owner',
            full_name: ipOwnerProfile.full_name,
            pen_name_or_studio: ipOwnerProfile.pen_name_or_studio,
            ip_owner_role: ipOwnerProfile.ip_owner_role,
            ip_owner_company: ipOwnerProfile.ip_owner_company,
            website_url: ipOwnerProfile.website_url
          },
          aud: 'authenticated',
          created_at: ipOwnerProfile.created_at || new Date().toISOString(),
          updated_at: ipOwnerProfile.updated_at || new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          role: 'authenticated',
          confirmation_sent_at: new Date().toISOString(),
        } as User;
      }
    } catch (error) {
      console.log('⚠️ AUTH BYPASS: Could not find existing user data, creating mock user:', error);
    }

    // If no existing user found, create a mock user with a known ID
    console.log('🏗️ AUTH BYPASS: Creating mock user for sungho@dadble.com');
    return {
      id: '550e8400-e29b-41d4-a716-446655440000', // Fixed UUID for consistency
      email: 'sungho@dadble.com',
      app_metadata: {},
      user_metadata: { 
        account_type: 'buyer',
        full_name: 'Sungho Lee'
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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 DASHBOARD: Initializing auth...');
        
        // Check if we should bypass auth for localhost development
        if (shouldBypassAuth()) {
          const mockUser = await createMockUser();
          const mockSession = createMockSession(mockUser);
          
          if (mounted) {
            setUser(mockUser);
            setSession(mockSession);
            setLoading(false);
          }
          return;
        }
        // Check for session parameters in URL (for cross-domain auth)
        const urlParams = new URLSearchParams(window.location.search);
        console.log('🔍 DASHBOARD: URL params check:', {
          hasAccessToken: urlParams.has('access_token'),
          searchString: window.location.search,
          pathname: window.location.pathname
        });
        
        if (urlParams.has('access_token')) {
          console.log('🔗 DASHBOARD: Found access token in URL, setting session from URL...');
          
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          
          if (!accessToken) {
            console.error('❌ DASHBOARD: No access token found in URL');
            setLoading(false);
            return;
          }

          const sessionData = {
            access_token: accessToken,
            refresh_token: refreshToken || '',
            expires_at: urlParams.get('expires_at') ? parseInt(urlParams.get('expires_at')!) : undefined,
            token_type: urlParams.get('token_type') || 'bearer'
          };

          console.log('🔗 DASHBOARD: Session data to set:', { 
            hasAccessToken: !!sessionData.access_token, 
            hasRefreshToken: !!sessionData.refresh_token,
            expiresAt: sessionData.expires_at,
            accessTokenLength: sessionData.access_token?.length,
            refreshTokenLength: sessionData.refresh_token?.length,
            tokenType: sessionData.token_type
          });
          
          // Check if tokens look valid
          if (!sessionData.access_token || sessionData.access_token.length < 10) {
            console.error('❌ DASHBOARD: Access token appears invalid:', sessionData.access_token?.substring(0, 20) + '...');
          }
          
          if (sessionData.expires_at && sessionData.expires_at < Math.floor(Date.now() / 1000)) {
            console.error('❌ DASHBOARD: Token appears to be expired:', new Date(sessionData.expires_at * 1000));
          }

          try {
            const { data: { session }, error } = await supabase.auth.setSession(sessionData);
            
            if (!mounted) return;
            
            if (error) {
              console.error('❌ DASHBOARD: Error setting session from URL parameters:', error);
              console.error('❌ DASHBOARD: Error details:', error.message);
              
              // Clear the URL parameters if token validation failed
              console.log('🧹 DASHBOARD: Clearing invalid tokens from URL');
              window.history.replaceState({}, document.title, window.location.pathname);
              
              setLoading(false);
            } else if (session?.user) {
              console.log('✅ DASHBOARD: Successfully set session from URL for user:', session.user.email);
              console.log('✅ DASHBOARD: Session expires at:', new Date(session.expires_at * 1000));
              setSession(session);
              setUser(session.user);
              // Clean up URL
              window.history.replaceState({}, document.title, window.location.pathname);
              console.log('🧹 DASHBOARD: Cleaned up URL');
            } else {
              console.error('❌ DASHBOARD: No session or user found after setting session');
              console.error('❌ DASHBOARD: Session data received:', session);
              setLoading(false);
            }
          } catch (err) {
            console.error('❌ DASHBOARD: Exception during setSession:', err);
            
            // Clear the URL parameters if there was an exception
            console.log('🧹 DASHBOARD: Clearing tokens from URL due to exception');
            window.history.replaceState({}, document.title, window.location.pathname);
            
            setLoading(false);
          }
        } else {
          console.log('🔍 DASHBOARD: No URL params, checking for existing session...');
          // Check for existing session
          const { data: { session } } = await supabase.auth.getSession();
          console.log('🔍 DASHBOARD: Existing session check:', !!session, session?.user?.email);
          
          if (!mounted) return;
          
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('❌ DASHBOARD: Error initializing dashboard auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('🏁 DASHBOARD: Auth initialization complete');
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('🚪 DASHBOARD: Starting sign out process');
    // Redirect immediately before clearing auth state
    const websiteUrl = getWebsiteUrl();
    const signOutUrl = `${websiteUrl}${websiteUrl.includes('?') ? '&' : '?'}signed_out=true`;
    console.log('🚪 DASHBOARD: Sign out - websiteUrl:', websiteUrl);
    console.log('🚪 DASHBOARD: Sign out - signOutUrl:', signOutUrl);
    console.log('🚪 DASHBOARD: Sign out - current location:', window.location.href);
    
    // Redirect first, then sign out to prevent ProtectedRoute from interfering
    window.location.href = signOutUrl;
    
    // Sign out after redirect is initiated
    setTimeout(async () => {
      await supabase.auth.signOut();
    }, 100);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
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