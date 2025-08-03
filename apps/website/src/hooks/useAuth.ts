import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { getDashboardUrl } from '../config/urls';

interface UserProfile {
  account_type: 'buyer' | 'ip_owner';
  invitation_status: string;
  role?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const redirectToDashboard = async (userProfile: UserProfile) => {
    console.log('🔄 WEBSITE: redirectToDashboard called with profile:', userProfile);
    
    // Prevent redirect if we're already on dashboard domain
    if (window.location.hostname.includes('dashboard') || window.location.port === '8081') {
      console.log('🚫 WEBSITE: Already on dashboard, skipping redirect');
      return;
    }
    
    if (userProfile.invitation_status === 'accepted') {
      console.log('✅ WEBSITE: Invitation status is accepted, proceeding with dashboard redirect');
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('🔄 WEBSITE: Current session details:', {
          hasAccessToken: !!session.access_token,
          hasRefreshToken: !!session.refresh_token,
          expiresAt: session.expires_at,
          expiresAtDate: session.expires_at ? new Date(session.expires_at * 1000) : 'N/A',
          tokenType: session.token_type,
          userEmail: session.user?.email,
          isExpired: session.expires_at ? session.expires_at < Math.floor(Date.now() / 1000) : 'Unknown'
        });
        
        const dashboardUrl = getDashboardUrl();
        const sessionParams = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token || '',
          expires_at: session.expires_at?.toString() || '',
          token_type: session.token_type || 'bearer'
        });
        const finalUrl = `${dashboardUrl}?${sessionParams.toString()}`;
        console.log('🔄 WEBSITE: Redirecting to dashboard:', finalUrl.substring(0, 100) + '...');
        
        // Add delay to prevent rapid redirects
        setTimeout(() => {
          window.location.href = finalUrl;
        }, 100);
      } else {
        console.error('❌ WEBSITE: No session found for authenticated user');
        navigate('/invited');
      }
    } else {
      console.log('⚠️ WEBSITE: Invitation status is not accepted:', userProfile.invitation_status);
      const invitedPath = userProfile.account_type === 'ip_owner' ? '/creator/invited' : '/invited';
      navigate(invitedPath);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    navigate('/');
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 WEBSITE: Initializing auth...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🚀 WEBSITE: Session check result:', !!session, session?.user?.email);
        
        if (!mounted) return;

        if (session?.user) {
          console.log('✅ WEBSITE: User found, setting user state');
          setUser(session.user);
          
          // Fetch user profile
          const accountType = session.user.user_metadata?.account_type;
          console.log('👤 WEBSITE: Account type:', accountType);
          
          let profile = null;
          if (accountType === 'buyer') {
            const { data, error } = await supabase
              .from('user_buyers')
              .select('invitation_status, buyer_role')
              .eq('id', session.user.id)
              .maybeSingle();
            
            console.log('👤 WEBSITE: Buyer profile query result:', { data, error });
            
            if (!error && data) {
              profile = {
                account_type: 'buyer' as const,
                invitation_status: data.invitation_status || 'invited',
                role: data.buyer_role
              };
            }
          } else if (accountType === 'ip_owner') {
            const { data, error } = await supabase
              .from('user_ipowners')
              .select('invitation_status, ip_owner_role')
              .eq('id', session.user.id)
              .maybeSingle();
            
            console.log('👤 WEBSITE: IP owner profile query result:', { data, error });
            
            if (!error && data) {
              profile = {
                account_type: 'ip_owner' as const,
                invitation_status: data.invitation_status || 'invited',
                role: data.ip_owner_role
              };
            }
          }
          
          console.log('👤 WEBSITE: Final profile result:', profile);
          if (!mounted) return;
          
          if (profile) {
            setUserProfile(profile);
            
            // Auto-redirect from homepage if user is authenticated and accepted
            // Only redirect if we're actually on the website (not dashboard) and not coming from dashboard or sign out
            const urlParams = new URLSearchParams(window.location.search);
            const hasRedirectParam = urlParams.has('from_dashboard');
            const hasSignedOutParam = urlParams.has('signed_out');
            
            // Clean up signed_out parameter from URL if present
            if (hasSignedOutParam) {
              console.log('🚪 WEBSITE: Detected sign out parameter, cleaning URL');
              urlParams.delete('signed_out');
              const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
              window.history.replaceState({}, document.title, newUrl);
            }
            const isOnWebsite = window.location.port === '5173' || 
                                window.location.hostname.includes('kstorybridge-website') ||
                                window.location.hostname === 'kstorybridge.com';
            if (location.pathname === '/' && !isRedirecting && isOnWebsite && !hasRedirectParam && !hasSignedOutParam) {
              console.log('🏠 WEBSITE: On homepage, checking if should redirect to dashboard');
              console.log('🏠 WEBSITE: Profile invitation_status:', profile.invitation_status);
              console.log('🏠 WEBSITE: Current location:', location.pathname);
              console.log('🏠 WEBSITE: Current port:', window.location.port);
              console.log('🏠 WEBSITE: Is redirecting:', isRedirecting);
              console.log('🏠 WEBSITE: Has redirect param:', hasRedirectParam);
              
              setIsRedirecting(true);
              console.log('🚀 WEBSITE: Starting redirect to dashboard...');
              await redirectToDashboard(profile);
            } else {
              console.log('🏠 WEBSITE: Skipping redirect - not on homepage or not on website or from dashboard/signout', {
                pathname: location.pathname,
                port: window.location.port,
                hostname: window.location.hostname,
                isOnWebsite,
                isRedirecting,
                hasRedirectParam,
                hasSignedOutParam
              });
            }
          } else {
            console.error('❌ WEBSITE: Failed to fetch user profile');
          }
        } else {
          console.log('❌ WEBSITE: No user in session');
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('❌ WEBSITE: Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          console.log('🏁 WEBSITE: Auth initialization complete');
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 WEBSITE: Auth state change event:', event);
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          // Handle sign out immediately
          setUser(null);
          setUserProfile(null);
          setIsRedirecting(false);
        } else if (session?.user) {
          setUser(session.user);
          // Don't auto-redirect on auth state changes, only on initial load
        } else {
          setUser(null);
          setUserProfile(null);
          setIsRedirecting(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [location.pathname, isRedirecting]);

  return {
    user,
    userProfile,
    isLoading,
    isRedirecting,
    signOut
  };
};