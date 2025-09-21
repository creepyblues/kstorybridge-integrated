import { supabase } from '@/integrations/supabase/client';
import { databaseClient } from '../database/DatabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/services/emailService';
import { notifyBuyerSignup, notifyCreatorSignup } from '@/utils/slack';

export interface AuthUser extends User {
  // Extended with common fields we use
  full_name?: string;
  account_type?: 'buyer' | 'creator';
}

export interface SignupData {
  email: string;
  password: string;
  metadata?: Record<string, any>;
  emailRedirectTo?: string;
}

export interface AuthResult {
  user: AuthUser | null;
  session: Session | null;
  error?: string;
}

export interface ProfileData {
  buyer?: {
    full_name: string;
    buyer_company: string;
    buyer_role: string;
    linkedin_url?: string;
    tier?: 'basic' | 'invited' | 'pro' | 'suite';
  };
  creator?: {
    full_name: string;
    pen_name: string;
    ip_owner_role?: string;
    ip_owner_company?: string;
    website_url?: string;
    invitation_status?: string;
  };
}

/**
 * Centralized authentication service
 */
export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Sign up with email and password
   */
  async signUp(data: SignupData): Promise<AuthResult> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: data.metadata,
          emailRedirectTo: data.emailRedirectTo
        }
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      return {
        user: authData.user as AuthUser,
        session: authData.session,
      };

    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Signup failed'
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      return {
        user: data.user as AuthUser,
        session: data.session,
      };

    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  }

  /**
   * OAuth sign in
   */
  async signInWithOAuth(
    provider: 'google' | 'discord',
    options?: {
      redirectTo?: string;
      queryParams?: Record<string, string>;
    }
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options
      });

      if (error) {
        return { error: error.message };
      }

      return {};

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'OAuth sign in failed'
      };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ error?: string }> {
    return await databaseClient.signOut();
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    return await databaseClient.getCurrentUser() as AuthUser | null;
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    return await databaseClient.getCurrentSession();
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { error: error.message };
      }

      return {};

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Password reset failed'
      };
    }
  }

  /**
   * Update user metadata
   */
  async updateUserMetadata(metadata: Record<string, any>, skipSessionCheck: boolean = false): Promise<{ error?: string }> {
    try {
      console.log('🔄 AuthService: Updating user metadata:', Object.keys(metadata));

      // Skip session check during OAuth flow (causes timeouts)
      if (!skipSessionCheck) {
        // Check current session first
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ AuthService: Session error before metadata update:', sessionError);
          return { error: `Session error: ${sessionError.message}` };
        }

        if (!sessionData.session) {
          console.error('❌ AuthService: No active session for metadata update');
          return { error: 'No active session found' };
        }

        console.log('✅ AuthService: Session valid, proceeding with metadata update');
      } else {
        console.log('⚡ AuthService: Skipping session check for OAuth flow');
      }

      const { error } = await supabase.auth.updateUser({
        data: metadata
      });

      if (error) {
        console.error('❌ AuthService: Metadata update failed:', error);
        return { error: error.message };
      }

      console.log('✅ AuthService: Metadata updated successfully');
      return {};

    } catch (error) {
      console.error('❌ AuthService: Exception during metadata update:', error);
      return {
        error: error instanceof Error ? error.message : 'Metadata update failed'
      };
    }
  }

  /**
   * Exchange OAuth code for session
   */
  async exchangeCodeForSession(code: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return { user: null, session: null, error: error.message };
      }

      return {
        user: data.user as AuthUser,
        session: data.session,
      };

    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : 'Code exchange failed'
      };
    }
  }

  /**
   * Create user profile after signup
   */
  async createUserProfile(
    user: AuthUser,
    accountType: 'buyer' | 'creator',
    profileData: ProfileData
  ): Promise<{ error?: string }> {
    try {
      if (accountType === 'buyer' && profileData.buyer) {
        const { error } = await databaseClient.insert('user_buyers', {
          id: user.id,
          email: user.email,
          ...profileData.buyer
        });

        if (error) {
          return { error };
        }

        // Send notifications
        await Promise.all([
          this.sendBuyerNotifications(user, profileData.buyer),
        ]);

      } else if (accountType === 'creator' && profileData.creator) {
        const { error } = await databaseClient.insert('user_creators', {
          id: user.id,
          email: user.email,
          ...profileData.creator,
          invitation_status: profileData.creator.invitation_status || 'invited'
        });

        if (error) {
          return { error };
        }

        // Send notifications
        await Promise.all([
          this.sendCreatorNotifications(user, profileData.creator),
        ]);
      }

      return {};

    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Profile creation failed'
      };
    }
  }

  /**
   * Check if user profile exists
   */
  async checkProfileExists(
    email: string,
    accountType: 'buyer' | 'creator'
  ): Promise<boolean> {
    const table = accountType === 'buyer' ? 'user_buyers' : 'user_creators';
    const { data } = await databaseClient.select(table, 'email', {
      filters: { email },
      single: true
    });

    return !!data;
  }

  /**
   * Get user profile
   */
  async getUserProfile(
    email: string,
    accountType: 'buyer' | 'creator'
  ): Promise<{ data: any; error?: string }> {
    const table = accountType === 'buyer' ? 'user_buyers' : 'user_creators';
    return await databaseClient.select(table, '*', {
      filters: { email },
      single: true
    });
  }

  /**
   * Auth state change listener
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // Private helper methods
  private async sendBuyerNotifications(user: AuthUser, profile: NonNullable<ProfileData['buyer']>) {
    try {
      await Promise.all([
        notifyBuyerSignup({
          userName: profile.full_name,
          userEmail: user.email!,
          buyerCompany: profile.buyer_company,
          buyerRole: profile.buyer_role
        }),
        sendWelcomeEmail({
          userName: profile.full_name,
          userEmail: user.email!,
          accountType: 'buyer',
          dashboardUrl: `${window.location.origin}/buyers/home`,
          loginUrl: `${window.location.origin}/signin`
        })
      ]);
    } catch (error) {
      console.error('Failed to send buyer notifications:', error);
    }
  }

  private async sendCreatorNotifications(user: AuthUser, profile: NonNullable<ProfileData['creator']>) {
    try {
      await Promise.all([
        notifyCreatorSignup({
          userName: profile.full_name,
          userEmail: user.email!,
          penName: profile.pen_name,
          ipOwnerRole: profile.ip_owner_role,
          ipOwnerCompany: profile.ip_owner_company
        }),
        sendWelcomeEmail({
          userName: profile.full_name,
          userEmail: user.email!,
          accountType: 'creator',
          dashboardUrl: `${window.location.origin}/creators/home`,
          loginUrl: `${window.location.origin}/signin`
        })
      ]);
    } catch (error) {
      console.error('Failed to send creator notifications:', error);
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
