import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  account_type: 'buyer' | 'ip_owner';
  invitation_status: string;
  role?: string;
}

export const useAuthenticatedUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchUserProfile = async (user: User) => {
    try {
      const accountType = user.user_metadata?.account_type;
      
      if (accountType === 'buyer') {
        const { data: profile, error } = await supabase
          .from('user_buyers')
          .select('invitation_status, buyer_role')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching buyer profile:', error);
          return;
        }
        
        setUserProfile({
          account_type: 'buyer',
          invitation_status: profile?.invitation_status || 'invited',
          role: profile?.buyer_role
        });
      } else if (accountType === 'ip_owner') {
        const { data: profile, error } = await supabase
          .from('user_ipowners')
          .select('invitation_status, ip_owner_role')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching IP owner profile:', error);
          return;
        }
        
        setUserProfile({
          account_type: 'ip_owner',
          invitation_status: profile?.invitation_status || 'invited',
          role: profile?.ip_owner_role
        });
      }
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
    }
  };

  const redirectToDashboard = async (user: User) => {
    try {
      console.log('Redirecting user to dashboard:', user.id);
      console.log('Current location:', location.pathname);
      
      const accountType = user.user_metadata?.account_type;
      let profile = null;
      
      if (accountType === 'buyer') {
        const { data, error } = await supabase
          .from('user_buyers')
          .select('invitation_status')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching buyer profile:', error);
          setIsRedirecting(false);
          return;
        }
        
        profile = { ...data, account_type: 'buyer' };
      } else if (accountType === 'ip_owner') {
        const { data, error } = await supabase
          .from('user_ipowners')
          .select('invitation_status')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching IP owner profile:', error);
          setIsRedirecting(false);
          return;
        }
        
        profile = { ...data, account_type: 'ip_owner' };
      }
      
      if (profile) {
        console.log('Profile found, invitation_status:', profile.invitation_status, 'account_type:', profile.account_type);
        
        if (profile.invitation_status === 'invited') {
          console.log('Redirecting to invited dashboard');
          navigate('/dashboard/invited');
        } else if (profile.invitation_status === 'accepted') {
          if (profile.account_type === 'ip_owner') {
            console.log('Redirecting to creator dashboard');
            navigate('/dashboard/creator');
          } else {
            console.log('Redirecting to buyer dashboard');
            navigate('/dashboard/buyer');
          }
        } else {
          console.log('Invitation status not recognized:', profile.invitation_status);
          navigate('/dashboard/invited');
        }
      } else {
        console.log('No profile found');
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      setIsRedirecting(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user);
        
        // If user is signed in and on home page or Dashboard page, redirect to dashboard
        if ((location.pathname === '/' || location.pathname === '/Dashboard') && !isRedirecting) {
          setIsRedirecting(true);
          await redirectToDashboard(session.user);
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user);
          
          // If user just signed in and on home page or Dashboard page, redirect to dashboard
          if ((location.pathname === '/' || location.pathname === '/Dashboard') && !isRedirecting) {
            setIsRedirecting(true);
            await redirectToDashboard(session.user);
          }
        } else {
          setUserProfile(null);
          setIsRedirecting(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [location.pathname, navigate, isRedirecting]);

  return {
    user,
    userProfile,
    isLoading,
    isRedirecting,
    signOut
  };
};