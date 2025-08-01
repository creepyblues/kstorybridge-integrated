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
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadAdminProfile(session.user.email!);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadAdminProfile(session.user.email!);
        } else {
          setAdminProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAdminProfile = async (email: string) => {
    try {
      console.log('Loading admin profile for authenticated user:', email);
      
      // Only attempt this after user is already authenticated
      // This should work because the user has a valid session
      const { data, error } = await supabase
        .from('admin')
        .select('*')
        .eq('email', email)
        .eq('active', true)
        .single();

      console.log('Admin profile query result:', { data, error });

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No admin record found for email:', email);
          console.log('User is authenticated but not an admin');
        } else {
          console.error('Error loading admin profile:', error);
          console.log('Database error after authentication - this may be a policy issue');
        }
        setAdminProfile(null);
      } else {
        console.log('Admin profile loaded successfully:', data);
        setAdminProfile(data);
      }
    } catch (error) {
      console.error('Error loading admin profile:', error);
      setAdminProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    console.log('Attempting authentication for email:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('Authentication result:', { error });
    
    if (!error) {
      console.log('Authentication successful - admin profile will be checked automatically');
      // The auth state change listener will handle admin profile loading
    } else {
      console.error('Authentication failed:', error);
      setIsLoading(false);
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAdminProfile(null);
  };

  const value = {
    user,
    adminProfile,
    session,
    isLoading,
    signIn,
    signOut,
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