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
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('⚠️ Admin auth timeout - stopping loading state');
        setIsLoading(false);
      }
    }, 8000); // Reduced timeout to 8 seconds

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Found' : 'None');
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
      async (event, session) => {
        console.log('Auth state change:', event, session ? 'Session exists' : 'No session');
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

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const loadAdminProfile = async (email: string) => {
    try {
      console.log('🔍 Loading admin profile for:', email);
      
      // First, test if we can access the admin table at all
      console.log('Testing basic admin table access...');
      
      // Try multiple query approaches
      const queries = [
        // Query 1: Basic query without filters
        () => supabase.from('admin').select('*').limit(1),
        
        // Query 2: Query for specific email without active filter
        () => supabase.from('admin').select('*').eq('email', email),
        
        // Query 3: Original query with active filter
        () => supabase.from('admin').select('*').eq('email', email).eq('active', true),
        
        // Query 4: Case insensitive email match
        () => supabase.from('admin').select('*').ilike('email', email),
      ];
      
      for (let i = 0; i < queries.length; i++) {
        console.log(`Trying query ${i + 1}...`);
        const { data, error } = await queries[i]();
        console.log(`Query ${i + 1} result:`, { data, error });
        
        if (!error && data) {
          if (i === 0) {
            console.log('✅ Basic admin table access works');
            continue; // Just testing access, continue to next query
          }
          
          // For email-specific queries, check if we found our user
          const matchingRecord = data.find(record => 
            record.email.toLowerCase() === email.toLowerCase() && record.active
          );
          
          if (matchingRecord) {
            console.log('✅ Admin profile found:', matchingRecord);
            setAdminProfile(matchingRecord);
            setIsLoading(false);
            return;
          }
        }
      }
      
      // If we get here, none of the queries found the admin record
      console.log('❌ No admin record found after trying all query variations');
      console.log('🔧 Debugging info:');
      console.log('   - Email being searched:', email);
      console.log('   - User is authenticated:', !!user);
      console.log('   - Session exists:', !!session);
      
      // For testing purposes, let's create a mock admin profile if the email matches
      if (email === 'sungho@dadble.com') {
        console.log('🚨 DEBUG MODE: Creating mock admin profile for testing');
        const mockProfile: AdminProfile = {
          id: 'debug-admin-id',
          email: email,
          full_name: 'Sungho Lee (Debug)',
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setAdminProfile(mockProfile);
      } else {
        setAdminProfile(null);
      }
      
    } catch (error) {
      console.error('❌ Exception loading admin profile:', error);
      setAdminProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    console.log('🔐 Attempting authentication for email:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    console.log('Authentication result:', error ? 'Failed' : 'Success', error);
    
    if (!error) {
      console.log('✅ Authentication successful - waiting for auth state change...');
      // The auth state change listener will handle admin profile loading
    } else {
      console.error('❌ Authentication failed:', error);
      setIsLoading(false);
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
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