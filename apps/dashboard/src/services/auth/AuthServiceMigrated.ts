/**
 * Migrated AuthService - Phase 1 Migration Component
 *
 * This is a drop-in replacement for AuthService.ts that uses the AuthAdapter
 * Can be safely enabled/disabled via feature flags without breaking changes
 */

import { authAdapter } from '@/adapters/authAdapter';
import { databaseClient } from '../database/DatabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/services/emailService';
import { notifyBuyerSignup, notifyCreatorSignup } from '@/utils/slack';
import { trackAuthError } from '@/services/authErrorTracking';
import { getMigrationConfig, logMigration } from '@/config/authMigration';

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
 * Migrated Authentication Service using AuthAdapter
 *
 * This service maintains 100% API compatibility with the original AuthService
 * while using the sealed auth package under the hood when migration flags are enabled
 */
export class AuthServiceMigrated {
  private static instance: AuthServiceMigrated;

  private constructor() {}

  static getInstance(): AuthServiceMigrated {
    if (!AuthServiceMigrated.instance) {
      AuthServiceMigrated.instance = new AuthServiceMigrated();
    }
    return AuthServiceMigrated.instance;
  }

  /**
   * Sign up with email and password
   */
  async signUp(data: SignupData): Promise<AuthResult> {
    try {
      logMigration('AuthServiceMigrated', 'Starting signUp operation', { email: data.email });

      const result = await authAdapter.signUp({
        email: data.email,
        password: data.password,
        metadata: data.metadata,
        options: {
          data: data.metadata,
          emailRedirectTo: data.emailRedirectTo
        }
      });

      if (result.error) {
        // Track signup error using the same tracking as original
        await trackAuthError({ message: result.error } as AuthError, {
          failureType: 'signup_email',
          stage: 'auth_adapter',
          email: data.email,
          errorMessage: result.error
        });

        logMigration('AuthServiceMigrated', 'SignUp failed', { error: result.error });
        return { user: null, session: null, error: result.error };
      }

      logMigration('AuthServiceMigrated', 'SignUp successful', { userId: result.user?.id });

      return {
        user: result.user as AuthUser,
        session: null, // Session will be established separately
        error: undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      logMigration('AuthServiceMigrated', 'SignUp exception', { error: errorMessage });

      return {
        user: null,
        session: null,
        error: errorMessage
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      logMigration('AuthServiceMigrated', 'Starting signIn operation', { email });

      const result = await authAdapter.signIn({
        email,
        password
      });

      if (result.error) {
        // Track signin error using the same tracking as original
        await trackAuthError({ message: result.error } as AuthError, {
          failureType: 'signin_email',
          stage: 'auth_adapter',
          email: email,
          errorMessage: result.error
        });

        logMigration('AuthServiceMigrated', 'SignIn failed', { error: result.error });
        return { user: null, session: null, error: result.error };
      }

      logMigration('AuthServiceMigrated', 'SignIn successful', { userId: result.user?.id });

      return {
        user: result.user as AuthUser,
        session: null, // Session will be established separately
        error: undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      logMigration('AuthServiceMigrated', 'SignIn exception', { error: errorMessage });

      return {
        user: null,
        session: null,
        error: errorMessage
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
      logMigration('AuthServiceMigrated', 'Starting OAuth signIn', { provider });

      const result = await authAdapter.signIn({
        email: '', // OAuth doesn't need email
        provider: provider as any,
        redirectTo: options?.redirectTo
      });

      if (result.error) {
        // Track OAuth signin error using the same tracking as original
        await trackAuthError({ message: result.error } as AuthError, {
          failureType: provider === 'google' ? 'signin_oauth' : 'signin_oauth',
          stage: 'auth_adapter',
          oauthProvider: provider,
          errorMessage: result.error
        });

        logMigration('AuthServiceMigrated', 'OAuth signIn failed', { error: result.error });
        return { error: result.error };
      }

      logMigration('AuthServiceMigrated', 'OAuth signIn initiated successfully');
      return {};

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OAuth sign in failed';
      logMigration('AuthServiceMigrated', 'OAuth signIn exception', { error: errorMessage });

      return { error: errorMessage };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ error?: string }> {
    logMigration('AuthServiceMigrated', 'Starting signOut operation');

    const result = await authAdapter.signOut();

    if (result.error) {
      logMigration('AuthServiceMigrated', 'SignOut failed', { error: result.error });
    } else {
      logMigration('AuthServiceMigrated', 'SignOut successful');
    }

    return result;
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    logMigration('AuthServiceMigrated', 'Getting current user');

    const user = await authAdapter.getCurrentUser();

    logMigration('AuthServiceMigrated', 'Current user result', {
      hasUser: !!user,
      userId: user?.id
    });

    return user as AuthUser | null;
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<Session | null> {
    logMigration('AuthServiceMigrated', 'Getting current session');

    const session = await authAdapter.getSession();

    logMigration('AuthServiceMigrated', 'Current session result', {
      hasSession: !!session,
      userId: session?.user?.id
    });

    return session as Session | null;
  }

  /**
   * Reset password
   * Note: This method will use the sealed auth package when available
   */
  async resetPassword(email: string): Promise<{ error?: string }> {
    try {
      logMigration('AuthServiceMigrated', 'Starting password reset', { email });

      // For now, fall back to DatabaseClient since sealed auth package
      // doesn't yet implement password reset
      const result = await databaseClient.resetPassword?.(email);

      if (result?.error) {
        logMigration('AuthServiceMigrated', 'Password reset failed', { error: result.error });
        return { error: result.error };
      }

      logMigration('AuthServiceMigrated', 'Password reset successful');
      return {};

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      logMigration('AuthServiceMigrated', 'Password reset exception', { error: errorMessage });

      return { error: errorMessage };
    }
  }

  /**
   * Update user metadata
   */
  async updateUserMetadata(metadata: Record<string, any>, skipSessionCheck: boolean = false): Promise<{ error?: string }> {
    try {
      logMigration('AuthServiceMigrated', 'Starting metadata update', {
        metadataKeys: Object.keys(metadata),
        skipSessionCheck
      });

      // For now, fall back to original implementation since sealed auth package
      // doesn't yet implement updateUser functionality in our adapter
      const config = getMigrationConfig();

      if (config.useAuthServiceAdapter) {
        // Use sealed auth when available
        // TODO: Implement updateUser in AuthAdapter
        logMigration('AuthServiceMigrated', 'Metadata update via sealed auth not yet implemented, falling back');
      }

      // Fall back to DatabaseClient for now
      const result = await databaseClient.updateUserMetadata?.(metadata, skipSessionCheck);

      if (result?.error) {
        logMigration('AuthServiceMigrated', 'Metadata update failed', { error: result.error });
        return { error: result.error };
      }

      logMigration('AuthServiceMigrated', 'Metadata update successful');
      return {};

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Metadata update failed';
      logMigration('AuthServiceMigrated', 'Metadata update exception', { error: errorMessage });

      return { error: errorMessage };
    }
  }

  /**
   * Exchange OAuth code for session
   */
  async exchangeCodeForSession(code: string): Promise<AuthResult> {
    try {
      logMigration('AuthServiceMigrated', 'Starting OAuth code exchange');

      // For now, fall back to DatabaseClient since sealed auth package
      // OAuth exchange needs to be implemented in the adapter
      const result = await databaseClient.exchangeCodeForSession?.(code);

      if (result?.error) {
        logMigration('AuthServiceMigrated', 'OAuth code exchange failed', { error: result.error });
        return { user: null, session: null, error: result.error };
      }

      logMigration('AuthServiceMigrated', 'OAuth code exchange successful');

      return {
        user: result?.user as AuthUser,
        session: result?.session,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Code exchange failed';
      logMigration('AuthServiceMigrated', 'OAuth code exchange exception', { error: errorMessage });

      return {
        user: null,
        session: null,
        error: errorMessage
      };
    }
  }

  // All other methods remain the same as the original AuthService
  // (createUserProfile, checkProfileExists, getUserProfile, etc.)

  /**
   * Create user profile after signup
   */
  async createUserProfile(
    user: AuthUser,
    accountType: 'buyer' | 'creator',
    profileData: ProfileData
  ): Promise<{ error?: string }> {
    // This method doesn't use auth operations, so it remains unchanged
    try {
      logMigration('AuthServiceMigrated', 'Creating user profile', {
        userId: user.id,
        accountType
      });

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

      logMigration('AuthServiceMigrated', 'User profile created successfully');
      return {};

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile creation failed';
      logMigration('AuthServiceMigrated', 'Profile creation exception', { error: errorMessage });

      return { error: errorMessage };
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
    // For now, fall back to DatabaseClient since sealed auth package
    // state change listener needs to be implemented in the adapter
    return databaseClient.onAuthStateChange?.(callback);
  }

  // Private helper methods (unchanged from original)
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
          dashboardUrl: `${window.location.origin}/buyers/chat`,
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
export const authServiceMigrated = AuthServiceMigrated.getInstance();