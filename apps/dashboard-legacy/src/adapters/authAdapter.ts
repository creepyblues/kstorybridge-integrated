/**
 * Auth Adapter - Gradual Migration Bridge
 *
 * This adapter allows seamless switching between:
 * - OLD: Direct Supabase auth calls
 * - NEW: Sealed auth package
 *
 * Based on feature flags, ensuring no breaking changes during migration
 */

import { supabase } from '@/integrations/supabase/client';
import { getMigrationConfig, logMigration, comparePerformance } from '@/config/authMigration';

// Type definitions that match both old and new systems
export interface AdapterAuthUser {
  id: string;
  email?: string | null;
  roles?: string[];
  metadata?: Record<string, any>;
  accountType?: 'buyer' | 'creator';
  // Include Supabase-specific fields for backward compatibility
  user_metadata?: Record<string, any>;
  role?: string;
}

export interface AdapterAuthSession {
  user: AdapterAuthUser;
  accessToken: string;
  expiresAt: number;
  // Include Supabase-specific fields for backward compatibility
  access_token?: string;
  expires_at?: number;
}

export interface AdapterSignUpParams {
  email: string;
  password?: string;
  provider?: 'google' | 'github' | 'apple';
  metadata?: Record<string, any>;
  redirectTo?: string;
  // Supabase-specific options for backward compatibility
  options?: {
    data?: Record<string, any>;
    emailRedirectTo?: string;
  };
}

export interface AdapterSignInParams {
  email: string;
  password?: string;
  provider?: 'google' | 'github' | 'apple';
  redirectTo?: string;
}

/**
 * Auth Adapter Class
 *
 * Provides unified interface that can switch between implementations
 */
export class AuthAdapter {
  private sealedAuth: any = null;

  constructor() {
    // Lazy load sealed auth package only when needed
    this.initializeSealedAuth();
  }

  private async initializeSealedAuth() {
    try {
      // Dynamically import sealed auth package when migration flag is enabled
      const config = getMigrationConfig();
      if (config.useAuthServiceAdapter || config.useDatabaseClientAdapter) {
        const { auth } = await import('@kstorybridge/auth');
        this.sealedAuth = auth;
        logMigration('AuthAdapter', 'Sealed auth package loaded successfully');
      }
    } catch (error) {
      logMigration('AuthAdapter', 'Failed to load sealed auth package', error);
      // Fallback to Supabase - no breaking changes
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(params: AdapterSignUpParams): Promise<{ user: AdapterAuthUser | null; error?: string }> {
    const config = getMigrationConfig();
    const startTime = performance.now();

    try {
      if (config.useAuthServiceAdapter && this.sealedAuth) {
        logMigration('AuthAdapter', 'Using sealed auth for signUp');

        const result = await this.sealedAuth.signUp({
          email: params.email,
          password: params.password,
          provider: params.provider,
          metadata: params.metadata || params.options?.data,
          redirectTo: params.redirectTo || params.options?.emailRedirectTo
        });

        const endTime = performance.now();
        comparePerformance('AuthAdapter', 0, endTime - startTime, 'signUp');

        return { user: this.mapSealedAuthUser(result) };
      } else {
        logMigration('AuthAdapter', 'Using Supabase for signUp');

        const { data, error } = await supabase.auth.signUp({
          email: params.email,
          password: params.password!,
          options: params.options
        });

        const endTime = performance.now();
        comparePerformance('AuthAdapter', endTime - startTime, 0, 'signUp');

        if (error) {
          return { user: null, error: error.message };
        }

        return { user: this.mapSupabaseUser(data.user) };
      }
    } catch (error) {
      const endTime = performance.now();

      if (config.rollbackOnError && this.sealedAuth) {
        logMigration('AuthAdapter', 'Error with sealed auth, rolling back to Supabase', error);
        // Fallback to Supabase on error
        const { data, error: supabaseError } = await supabase.auth.signUp({
          email: params.email,
          password: params.password!,
          options: params.options
        });

        comparePerformance('AuthAdapter', endTime - startTime, 0, 'signUp (rollback)');

        if (supabaseError) {
          return { user: null, error: supabaseError.message };
        }
        return { user: this.mapSupabaseUser(data.user) };
      }

      return { user: null, error: error instanceof Error ? error.message : 'Signup failed' };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(params: AdapterSignInParams): Promise<{ user: AdapterAuthUser | null; error?: string }> {
    const config = getMigrationConfig();
    const startTime = performance.now();

    try {
      if (config.useAuthServiceAdapter && this.sealedAuth) {
        logMigration('AuthAdapter', 'Using sealed auth for signIn');

        const result = await this.sealedAuth.signIn({
          email: params.email,
          password: params.password,
          provider: params.provider,
          redirectTo: params.redirectTo
        });

        const endTime = performance.now();
        comparePerformance('AuthAdapter', 0, endTime - startTime, 'signIn');

        return { user: this.mapSealedAuthUser(result) };
      } else {
        logMigration('AuthAdapter', 'Using Supabase for signIn');

        const { data, error } = await supabase.auth.signInWithPassword({
          email: params.email,
          password: params.password!
        });

        const endTime = performance.now();
        comparePerformance('AuthAdapter', endTime - startTime, 0, 'signIn');

        if (error) {
          return { user: null, error: error.message };
        }

        return { user: this.mapSupabaseUser(data.user) };
      }
    } catch (error) {
      const endTime = performance.now();

      if (config.rollbackOnError && this.sealedAuth) {
        logMigration('AuthAdapter', 'Error with sealed auth, rolling back to Supabase', error);

        const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
          email: params.email,
          password: params.password!
        });

        comparePerformance('AuthAdapter', endTime - startTime, 0, 'signIn (rollback)');

        if (supabaseError) {
          return { user: null, error: supabaseError.message };
        }
        return { user: this.mapSupabaseUser(data.user) };
      }

      return { user: null, error: error instanceof Error ? error.message : 'Signin failed' };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error?: string }> {
    const config = getMigrationConfig();
    const startTime = performance.now();

    try {
      if (config.useAuthServiceAdapter && this.sealedAuth) {
        logMigration('AuthAdapter', 'Using sealed auth for signOut');

        await this.sealedAuth.signOut();

        const endTime = performance.now();
        comparePerformance('AuthAdapter', 0, endTime - startTime, 'signOut');

        return {};
      } else {
        logMigration('AuthAdapter', 'Using Supabase for signOut');

        const { error } = await supabase.auth.signOut();

        const endTime = performance.now();
        comparePerformance('AuthAdapter', endTime - startTime, 0, 'signOut');

        if (error) {
          return { error: error.message };
        }
        return {};
      }
    } catch (error) {
      const endTime = performance.now();

      if (config.rollbackOnError && this.sealedAuth) {
        logMigration('AuthAdapter', 'Error with sealed auth, rolling back to Supabase', error);

        const { error: supabaseError } = await supabase.auth.signOut();

        comparePerformance('AuthAdapter', endTime - startTime, 0, 'signOut (rollback)');

        if (supabaseError) {
          return { error: supabaseError.message };
        }
        return {};
      }

      return { error: error instanceof Error ? error.message : 'Signout failed' };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<AdapterAuthSession | null> {
    const config = getMigrationConfig();
    const startTime = performance.now();

    try {
      if (config.useDatabaseClientAdapter && this.sealedAuth) {
        logMigration('AuthAdapter', 'Using sealed auth for getSession');

        const session = await this.sealedAuth.getSession();

        const endTime = performance.now();
        comparePerformance('AuthAdapter', 0, endTime - startTime, 'getSession');

        return session ? this.mapSealedAuthSession(session) : null;
      } else {
        logMigration('AuthAdapter', 'Using Supabase for getSession');

        const { data, error } = await supabase.auth.getSession();

        const endTime = performance.now();
        comparePerformance('AuthAdapter', endTime - startTime, 0, 'getSession');

        if (error || !data.session) {
          return null;
        }

        return this.mapSupabaseSession(data.session);
      }
    } catch (error) {
      const endTime = performance.now();

      if (config.rollbackOnError && this.sealedAuth) {
        logMigration('AuthAdapter', 'Error with sealed auth, rolling back to Supabase', error);

        const { data, error: supabaseError } = await supabase.auth.getSession();

        comparePerformance('AuthAdapter', endTime - startTime, 0, 'getSession (rollback)');

        if (supabaseError || !data.session) {
          return null;
        }
        return this.mapSupabaseSession(data.session);
      }

      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<AdapterAuthUser | null> {
    const config = getMigrationConfig();
    const startTime = performance.now();

    try {
      if (config.useDatabaseClientAdapter && this.sealedAuth) {
        logMigration('AuthAdapter', 'Using sealed auth for getCurrentUser');

        const user = await this.sealedAuth.getCurrentUser();

        const endTime = performance.now();
        comparePerformance('AuthAdapter', 0, endTime - startTime, 'getCurrentUser');

        return user ? this.mapSealedAuthUser(user) : null;
      } else {
        logMigration('AuthAdapter', 'Using Supabase for getCurrentUser');

        const { data, error } = await supabase.auth.getUser();

        const endTime = performance.now();
        comparePerformance('AuthAdapter', endTime - startTime, 0, 'getCurrentUser');

        if (error || !data.user) {
          return null;
        }

        return this.mapSupabaseUser(data.user);
      }
    } catch (error) {
      const endTime = performance.now();

      if (config.rollbackOnError && this.sealedAuth) {
        logMigration('AuthAdapter', 'Error with sealed auth, rolling back to Supabase', error);

        const { data, error: supabaseError } = await supabase.auth.getUser();

        comparePerformance('AuthAdapter', endTime - startTime, 0, 'getCurrentUser (rollback)');

        if (supabaseError || !data.user) {
          return null;
        }
        return this.mapSupabaseUser(data.user);
      }

      return null;
    }
  }

  // Mapping helpers to ensure compatibility
  private mapSupabaseUser(user: any): AdapterAuthUser | null {
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      roles: user.role ? [user.role] : [],
      metadata: user.user_metadata || {},
      accountType: user.user_metadata?.account_type,
      // Preserve Supabase fields for backward compatibility
      user_metadata: user.user_metadata,
      role: user.role
    };
  }

  private mapSealedAuthUser(user: any): AdapterAuthUser | null {
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      roles: user.roles || [],
      metadata: user.metadata || {},
      accountType: user.accountType,
      // Map to Supabase fields for backward compatibility
      user_metadata: user.metadata,
      role: user.roles?.[0]
    };
  }

  private mapSupabaseSession(session: any): AdapterAuthSession {
    return {
      user: this.mapSupabaseUser(session.user)!,
      accessToken: session.access_token,
      expiresAt: session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000,
      // Preserve Supabase fields
      access_token: session.access_token,
      expires_at: session.expires_at
    };
  }

  private mapSealedAuthSession(session: any): AdapterAuthSession {
    return {
      user: this.mapSealedAuthUser(session.user)!,
      accessToken: session.accessToken,
      expiresAt: session.expiresAt,
      // Map to Supabase fields for backward compatibility
      access_token: session.accessToken,
      expires_at: Math.floor(session.expiresAt / 1000)
    };
  }
}

// Export singleton instance
export const authAdapter = new AuthAdapter();